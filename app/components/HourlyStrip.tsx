"use client";

import type { HourlyForecast } from "@/lib/types";
import { iconUrl } from "@/lib/utils";

export default function HourlyStrip({ hourly }: { hourly: HourlyForecast[] }) {
  if (!hourly.length) return null;
  return (
    <section className="hourly">
      <h2 className="section-title">🕒 3時間ごとの予報</h2>
      <div className="hourly-strip">
        {hourly.map((h, i) => (
          <div className="hour-item" key={i}>
            <span className="hour-time">{String(h.time.hour).padStart(2, "0")}:00</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={iconUrl(h.icon)} alt={h.description} width={44} height={44} />
            <span className="hour-temp">{h.temp}°</span>
            <span className="hour-detail">💧{h.humidity}%</span>
            <span className="hour-detail pop">☔{h.pop}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
