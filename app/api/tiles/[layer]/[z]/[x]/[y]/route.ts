import { NextRequest, NextResponse } from "next/server";

// 雨雲レーダー用の地図タイルを OpenWeatherMap からプロキシする。
// API キーをブラウザに出さないため、タイル URL もサーバー経由にする。
export const runtime = "nodejs";

// 受け付けるレイヤーを限定（任意の URL を踏ませない）
const ALLOWED_LAYERS = new Set([
  "precipitation_new", // 降水（雨雲）
  "clouds_new", // 雲
  "temp_new", // 気温
  "wind_new", // 風
  "pressure_new", // 気圧
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ layer: string; z: string; x: string; y: string }> }
) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "APIキーが未設定です。" }, { status: 500 });
  }

  const { layer, z, x, y } = await params;

  if (!ALLOWED_LAYERS.has(layer)) {
    return NextResponse.json({ error: "未対応のレイヤーです。" }, { status: 400 });
  }
  // z/x/y は数値のみ許可
  if (![z, x, y].every((v) => /^\d+$/.test(v))) {
    return NextResponse.json({ error: "不正なタイル座標です。" }, { status: 400 });
  }

  const url = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${apiKey}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: "タイル取得に失敗しました。" }, { status: res.status });
    }
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        // タイルは変化が緩やかなのでブラウザ/CDN で短時間キャッシュ
        "Cache-Control": "public, max-age=600, s-maxage=600",
      },
    });
  } catch {
    return NextResponse.json({ error: "タイル取得中にエラーが発生しました。" }, { status: 500 });
  }
}
