"use client";

import type { CurrentWeather, DailyForecast } from "@/lib/types";
import { formatDateLong, iconUrl } from "@/lib/utils";

export default function WeatherCard({
  current,
  daily,
  date,
}: {
  current: CurrentWeather | null;
  daily: DailyForecast | null;
  date: string;
}) {
  // 今日なら current（現在の実測値）、それ以外は daily（その日の予報）を表示
  const temp = current ? current.temp : daily?.tempMax ?? 0;
  const description = current?.description ?? daily?.description ?? "";
  const icon = current?.icon ?? daily?.icon ?? "01d";
  const humidity = current?.humidity ?? daily?.humidity ?? 0;
  const pop = current?.pop ?? daily?.pop ?? 0;
  const tempMax = current?.tempMax ?? daily?.tempMax ?? 0;
  const tempMin = current?.tempMin ?? daily?.tempMin ?? 0;

  return (
    <section className="weather-card">
      <div className="wc-head">
        <div className="wc-date">{formatDateLong(date)}</div>
        {current && <div className="wc-now-badge">現在の天気</div>}
      </div>

      <div className="wc-main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="wc-icon" src={iconUrl(icon)} alt={description} width={140} height={140} />
        <div className="wc-temp-block">
          <div className="wc-temp">
            {temp}
            <span className="deg">°C</span>
          </div>
          <div className="wc-desc">{description}</div>
          {current && (
            <div className="wc-feels">体感 {current.feelsLike}°C</div>
          )}
        </div>
      </div>

      <div className="wc-stats">
        <Stat icon="🌡️" label="最高 / 最低" value={`${tempMax}° / ${tempMin}°`} />
        <Stat icon="💧" label="湿度" value={`${humidity}%`} />
        <Stat icon="☔" label="降水確率" value={`${pop}%`} highlight={pop >= 50} />
        {current && (
          <Stat icon="💨" label="風速" value={`${current.windSpeed} m/s`} />
        )}
      </div>
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
  highlight,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`stat ${highlight ? "stat-highlight" : ""}`}>
      <div className="stat-icon" aria-hidden>
        {icon}
      </div>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}
