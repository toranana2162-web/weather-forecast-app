import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// AI（Claude）による服装・持ち物提案。
// ANTHROPIC_API_KEY はサーバー環境変数からのみ読み込み、ブラウザには出さない。
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-opus-4-8";

// 構造化出力のスキーマ（必ずこの形の JSON が返る）
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string", description: "今日の天気をふまえた一言アドバイス（30〜60字程度）" },
    clothing: {
      type: "array",
      items: { type: "string" },
      description: "おすすめの服装（3〜5個、短い語句）",
    },
    items: {
      type: "array",
      items: { type: "string" },
      description: "持って行くと良い持ち物（2〜4個、短い語句）",
    },
  },
  required: ["summary", "clothing", "items"],
} as const;

type AdviceInput = {
  location?: string;
  date?: string;
  temp?: number;
  tempMin?: number;
  tempMax?: number;
  description?: string;
  pop?: number;
  humidity?: number;
  windSpeed?: number;
  isToday?: boolean;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // キー未設定でもアプリ全体は壊さない。UI 側で案内を出す。
    return NextResponse.json(
      {
        error:
          "AI提案を使うには、サーバーに ANTHROPIC_API_KEY を設定してください（Vercel の環境変数 / ローカルは .env.local）。",
        notConfigured: true,
      },
      { status: 503 }
    );
  }

  let body: AdviceInput;
  try {
    body = (await req.json()) as AdviceInput;
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です。" }, { status: 400 });
  }

  const w = [
    `場所: ${body.location ?? "不明"}`,
    `日付: ${body.date ?? "不明"}${body.isToday ? "（本日）" : ""}`,
    `天気: ${body.description ?? "不明"}`,
    body.isToday && typeof body.temp === "number" ? `現在の気温: ${body.temp}°C` : null,
    typeof body.tempMax === "number" && typeof body.tempMin === "number"
      ? `最高/最低: ${body.tempMax}°C / ${body.tempMin}°C`
      : null,
    typeof body.pop === "number" ? `降水確率: ${body.pop}%` : null,
    typeof body.humidity === "number" ? `湿度: ${body.humidity}%` : null,
    typeof body.windSpeed === "number" ? `風速: ${body.windSpeed} m/s` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: SCHEMA },
      },
      system:
        "あなたは日本のお出かけアドバイザーです。与えられた天気情報をもとに、その日の服装と持ち物を日本語で具体的かつ実用的に提案します。気温・降水確率・湿度・風を総合的に考慮してください。各項目は短い語句で、絵文字は使わず簡潔に。",
      messages: [
        {
          role: "user",
          content: `次の天気に合わせた服装と持ち物を提案してください。\n\n${w}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock && textBlock.type === "text" ? textBlock.text : "";
    const advice = JSON.parse(text);
    return NextResponse.json(advice);
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY が無効です。" }, { status: 502 });
    }
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "AIが混み合っています。少し待って再試行してください。" },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "AI提案の生成に失敗しました。" }, { status: 500 });
  }
}
