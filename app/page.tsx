"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WeatherResponse } from "@/lib/types";
import { weatherTheme } from "@/lib/utils";
import SearchBar from "./components/SearchBar";
import Calendar from "./components/Calendar";
import WeatherCard from "./components/WeatherCard";
import HourlyStrip from "./components/HourlyStrip";

export default function Home() {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (params: string, label: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "取得に失敗しました。");
      setData(json as WeatherResponse);
      setSelectedDate(json.current.date);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました。");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchCity = useCallback(
    (city: string) => fetchWeather(`city=${encodeURIComponent(city)}`, city),
    [fetchWeather]
  );

  const useGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("お使いのブラウザは現在地取得に対応していません。");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather(
          `lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
          "現在地"
        );
      },
      () => {
        setLoading(false);
        setError("現在地を取得できませんでした。位置情報の許可をご確認ください。");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [fetchWeather]);

  // 初回は東京の天気を表示
  useEffect(() => {
    searchCity("Tokyo");
  }, [searchCity]);

  const selectedDaily = useMemo(() => {
    if (!data || !selectedDate) return null;
    return data.daily.find((d) => d.date === selectedDate) ?? null;
  }, [data, selectedDate]);

  const isToday = selectedDate === data?.current.date;

  const theme = useMemo(() => {
    if (!data) return "theme-default";
    if (isToday) return weatherTheme(data.current.main, data.current.icon);
    if (selectedDaily) return weatherTheme(selectedDaily.main, selectedDaily.icon);
    return "theme-default";
  }, [data, selectedDaily, isToday]);

  return (
    <main className={`app ${theme}`}>
      <div className="overlay" />
      <div className="content">
        <header className="app-header">
          <h1>
            <span className="logo-icon" aria-hidden>
              ⛅
            </span>{" "}
            お天気予報
          </h1>
          <p className="subtitle">都市名で検索、または現在地の天気をチェック</p>
        </header>

        <SearchBar onSearch={searchCity} onGeolocate={useGeolocation} loading={loading} />

        {error && <div className="error-box">⚠️ {error}</div>}

        {loading && !data && <div className="loader">読み込み中…</div>}

        {data && (
          <>
            <div className="location-name">
              📍 {data.location.name}
              {data.location.country ? `, ${data.location.country}` : ""}
            </div>

            <Calendar
              days={data.daily}
              todayDate={data.current.date}
              selected={selectedDate}
              onSelect={setSelectedDate}
            />

            <WeatherCard
              current={isToday ? data.current : null}
              daily={selectedDaily}
              date={selectedDate!}
            />

            {selectedDaily && <HourlyStrip hourly={selectedDaily.hourly} />}
          </>
        )}

        <footer className="app-footer">
          データ提供:{" "}
          <a href="https://openweathermap.org/" target="_blank" rel="noreferrer">
            OpenWeatherMap
          </a>
        </footer>
      </div>
    </main>
  );
}
