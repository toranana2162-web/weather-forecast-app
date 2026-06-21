import { NextRequest, NextResponse } from "next/server";

// このルートはサーバー上でのみ実行される。
// OPENWEATHER_API_KEY はサーバー環境変数から読み込み、ブラウザには一切渡さない。
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = "https://api.openweathermap.org/data/2.5";

type OwmWeather = { description: string; icon: string; main: string };
type OwmMain = { temp: number; temp_min: number; temp_max: number; humidity: number };
type ForecastItem = {
  dt: number;
  main: OwmMain;
  weather: OwmWeather[];
  pop: number; // 降水確率 0..1
  dt_txt: string;
};

// dt(UTC秒) + timezone(秒) からその都市のローカル日付/時刻を求める
function localParts(dtSec: number, tzSec: number) {
  const d = new Date((dtSec + tzSec) * 1000);
  // UTCゲッターを使うことでオフセット済みの値をそのまま「ローカル」として扱える
  const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
  const hour = d.getUTCHours();
  return { date, hour };
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "サーバーに OPENWEATHER_API_KEY が設定されていません。" },
      { status: 500 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const city = sp.get("city");
  const lat = sp.get("lat");
  const lon = sp.get("lon");

  let query: string;
  if (lat && lon) {
    query = `lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
  } else if (city) {
    query = `q=${encodeURIComponent(city)}`;
  } else {
    return NextResponse.json(
      { error: "city または lat/lon を指定してください。" },
      { status: 400 }
    );
  }

  const common = `${query}&units=metric&lang=ja&appid=${apiKey}`;

  try {
    const [curRes, fcRes] = await Promise.all([
      fetch(`${BASE}/weather?${common}`, { cache: "no-store" }),
      fetch(`${BASE}/forecast?${common}`, { cache: "no-store" }),
    ]);

    if (!curRes.ok) {
      const status = curRes.status === 404 ? 404 : curRes.status;
      const msg =
        curRes.status === 404
          ? "都市が見つかりませんでした。名称を確認してください。"
          : curRes.status === 401
          ? "API キーが無効です。"
          : "天気情報の取得に失敗しました。";
      return NextResponse.json({ error: msg }, { status });
    }
    if (!fcRes.ok) {
      return NextResponse.json(
        { error: "予報データの取得に失敗しました。" },
        { status: fcRes.status }
      );
    }

    const cur = await curRes.json();
    const fc = await fcRes.json();

    const tz: number = fc.city?.timezone ?? cur.timezone ?? 0;

    // 3時間刻みの予報を日付ごとにまとめる
    const byDate = new Map<string, ForecastItem[]>();
    for (const item of fc.list as ForecastItem[]) {
      const { date } = localParts(item.dt, tz);
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(item);
    }

    const daily = Array.from(byDate.entries()).map(([date, items]) => {
      const temps = items.map((i) => i.main.temp);
      const tempMin = Math.min(...items.map((i) => i.main.temp_min), ...temps);
      const tempMax = Math.max(...items.map((i) => i.main.temp_max), ...temps);
      const humidity = Math.round(
        items.reduce((s, i) => s + i.main.humidity, 0) / items.length
      );
      const pop = Math.round(Math.max(...items.map((i) => i.pop ?? 0)) * 100);

      // 正午に最も近い時刻を代表として天気アイコン/説明を決める
      const rep = items.reduce((best, i) => {
        const h = localParts(i.dt, tz).hour;
        const bh = localParts(best.dt, tz).hour;
        return Math.abs(h - 12) < Math.abs(bh - 12) ? i : best;
      }, items[0]);

      const hourly = items.map((i) => ({
        time: localParts(i.dt, tz),
        temp: Math.round(i.main.temp),
        humidity: i.main.humidity,
        pop: Math.round((i.pop ?? 0) * 100),
        description: i.weather[0]?.description ?? "",
        icon: i.weather[0]?.icon ?? "01d",
      }));

      return {
        date,
        tempMin: Math.round(tempMin),
        tempMax: Math.round(tempMax),
        humidity,
        pop,
        description: rep.weather[0]?.description ?? "",
        icon: rep.weather[0]?.icon ?? "01d",
        main: rep.weather[0]?.main ?? "",
        hourly,
      };
    });

    // 「今日」の現在値（current weather エンドポイント）
    const todayDate = localParts(cur.dt, tz).date;
    const todayDaily = daily.find((d) => d.date === todayDate);
    const current = {
      date: todayDate,
      temp: Math.round(cur.main.temp),
      feelsLike: Math.round(cur.main.feels_like),
      tempMin: todayDaily?.tempMin ?? Math.round(cur.main.temp_min),
      tempMax: todayDaily?.tempMax ?? Math.round(cur.main.temp_max),
      humidity: cur.main.humidity,
      // current エンドポイントには pop が無いので、当日の予報から最大降水確率を採用
      pop: todayDaily?.pop ?? 0,
      description: cur.weather[0]?.description ?? "",
      icon: cur.weather[0]?.icon ?? "01d",
      main: cur.weather[0]?.main ?? "",
      windSpeed: cur.wind?.speed ?? 0,
    };

    return NextResponse.json({
      location: {
        name: cur.name || fc.city?.name || "",
        country: cur.sys?.country || fc.city?.country || "",
        lat: cur.coord?.lat,
        lon: cur.coord?.lon,
      },
      timezone: tz,
      current,
      daily,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "天気情報の取得中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
