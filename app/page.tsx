"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WeatherResponse, FavoriteCity } from "@/lib/types";
import { weatherTheme } from "@/lib/utils";
import {
  loadFavorites,
  isFavorite,
  addFavorite,
  removeFavorite,
} from "@/lib/favorites";
import SearchBar from "./components/SearchBar";
import Favorites from "./components/Favorites";
import Calendar from "./components/Calendar";
import WeatherCard from "./components/WeatherCard";
import HourlyStrip from "./components/HourlyStrip";
import RainRadar from "./components/RainRadar";
import OutfitAdvice from "./components/OutfitAdvice";

export default function Home() {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteCity[]>([]);

  // お気に入りは初回マウント時に localStorage から読み込む
  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

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

  // 現在表示中の地点（緯度経度が取れている場合のみお気に入り対象にできる）
  const currentCity: FavoriteCity | null = useMemo(() => {
    if (
      !data ||
      typeof data.location.lat !== "number" ||
      typeof data.location.lon !== "number"
    ) {
      return null;
    }
    return {
      name: data.location.name,
      country: data.location.country,
      lat: data.location.lat,
      lon: data.location.lon,
    };
  }, [data]);

  const currentIsFav = currentCity ? isFavorite(favorites, currentCity) : false;

  const toggleFavorite = useCallback(() => {
    if (!currentCity) return;
    setFavorites((prev) =>
      isFavorite(prev, currentCity)
        ? removeFavorite(prev, currentCity)
        : addFavorite(prev, currentCity)
    );
  }, [currentCity]);

  const selectFavorite = useCallback(
    (c: FavoriteCity) => fetchWeather(`lat=${c.lat}&lon=${c.lon}`, c.name),
    [fetchWeather]
  );

  const removeFav = useCallback((c: FavoriteCity) => {
    setFavorites((prev) => removeFavorite(prev, c));
  }, []);

  // AI 提案へ渡す天気サマリ（選択中の日に応じて current か daily を使う）
  const adviceInput = useMemo(() => {
    if (!data || !selectedDate) return null;
    return {
      location: data.location.name,
      date: selectedDate,
      isToday,
      temp: isToday ? data.current.temp : undefined,
      tempMin: isToday ? data.current.tempMin : selectedDaily?.tempMin,
      tempMax: isToday ? data.current.tempMax : selectedDaily?.tempMax,
      description: isToday ? data.current.description : selectedDaily?.description,
      pop: isToday ? data.current.pop : selectedDaily?.pop,
      humidity: isToday ? data.current.humidity : selectedDaily?.humidity,
      windSpeed: isToday ? data.current.windSpeed : undefined,
    };
  }, [data, selectedDate, selectedDaily, isToday]);

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

        <Favorites
          favorites={favorites}
          onSelect={selectFavorite}
          onRemove={removeFav}
          loading={loading}
        />

        {error && <div className="error-box">⚠️ {error}</div>}

        {loading && !data && <div className="loader">読み込み中…</div>}

        {data && (
          <>
            <div className="location-row">
              <div className="location-name">
                📍 {data.location.name}
                {data.location.country ? `, ${data.location.country}` : ""}
              </div>
              {currentCity && (
                <button
                  type="button"
                  className={`fav-toggle ${currentIsFav ? "on" : ""}`}
                  onClick={toggleFavorite}
                  aria-pressed={currentIsFav}
                  title={currentIsFav ? "お気に入りから削除" : "お気に入りに追加"}
                >
                  {currentIsFav ? "★ お気に入り" : "☆ お気に入りに追加"}
                </button>
              )}
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

            {adviceInput && <OutfitAdvice key={selectedDate} input={adviceInput} />}

            {currentCity && (
              <RainRadar
                lat={currentCity.lat}
                lon={currentCity.lon}
                name={data.location.name}
                timezone={data.timezone}
                current={data.current}
              />
            )}
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
