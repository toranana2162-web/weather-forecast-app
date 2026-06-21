const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];

// "2026-06-21" のような日付文字列を安全にパース（タイムゾーンずれを避ける）
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateLong(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS_JA[d.getDay()]}）`;
}

export function formatDateShort(dateStr: string): { day: number; weekday: string; month: number } {
  const d = parseDate(dateStr);
  return { day: d.getDate(), weekday: WEEKDAYS_JA[d.getDay()], month: d.getMonth() + 1 };
}

export function isWeekend(dateStr: string): "sat" | "sun" | null {
  const day = parseDate(dateStr).getDay();
  if (day === 0) return "sun";
  if (day === 6) return "sat";
  return null;
}

export function iconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

// 天気の main 値から背景グラデーションのクラス名を決める
export function weatherTheme(main: string, icon: string): string {
  const isNight = icon?.endsWith("n");
  const m = (main || "").toLowerCase();
  if (isNight) return "theme-night";
  if (m.includes("thunder")) return "theme-thunder";
  if (m.includes("rain") || m.includes("drizzle")) return "theme-rain";
  if (m.includes("snow")) return "theme-snow";
  if (m.includes("cloud")) return "theme-cloud";
  if (m.includes("clear")) return "theme-clear";
  if (m.includes("mist") || m.includes("fog") || m.includes("haze")) return "theme-mist";
  return "theme-default";
}
