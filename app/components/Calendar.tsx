"use client";

import type { DailyForecast } from "@/lib/types";
import { formatDateShort, iconUrl, isWeekend } from "@/lib/utils";

export default function Calendar({
  days,
  todayDate,
  selected,
  onSelect,
}: {
  days: DailyForecast[];
  todayDate: string;
  selected: string | null;
  onSelect: (date: string) => void;
}) {
  return (
    <section className="calendar" aria-label="日付選択カレンダー">
      <h2 className="section-title">📅 日付を選んで予報を切り替え</h2>
      <div className="calendar-strip">
        {days.map((d) => {
          const { day, weekday, month } = formatDateShort(d.date);
          const we = isWeekend(d.date);
          const active = selected === d.date;
          return (
            <button
              key={d.date}
              className={`cal-day ${active ? "active" : ""} ${we ? `we-${we}` : ""}`}
              onClick={() => onSelect(d.date)}
              aria-pressed={active}
            >
              {d.date === todayDate && <span className="today-badge">今日</span>}
              <span className="cal-weekday">{weekday}</span>
              <span className="cal-date">
                {month}/{day}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="cal-icon" src={iconUrl(d.icon)} alt={d.description} width={48} height={48} />
              <span className="cal-temps">
                <span className="t-max">{d.tempMax}°</span>
                <span className="t-min">{d.tempMin}°</span>
              </span>
              <span className="cal-pop">💧{d.pop}%</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
