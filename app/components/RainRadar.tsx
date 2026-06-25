"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Circle, CircleMarker } from "leaflet";
import type { CurrentWeather } from "@/lib/types";
import "leaflet/dist/leaflet.css";

const PRECIP_MAINS = new Set(["Rain", "Drizzle", "Thunderstorm"]);

// 10分ごとにタイルURLを切り替えてブラウザキャッシュを更新
function precipTileEpoch(): number {
  return Math.floor(Date.now() / 600_000);
}

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];

// 都市のタイムゾーン（UTCオフセット秒）から「現在」の現地時刻ラベルを作る
function nowInCity(tzSec: number): string {
  const d = new Date(Date.now() + tzSec * 1000);
  const mo = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const wd = WEEKDAYS_JA[d.getUTCDay()];
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${mo}月${day}日（${wd}）${hh}:${mm}`;
}

// 雨雲レーダー。OpenStreetMap をベースに、降水レイヤーを自前のタイルプロキシ経由で重ねる。
// ※ OpenWeatherMap の precipitation タイルは「現在（実況）」の雨雲。カレンダーで選んだ日付とは無関係。
// Leaflet は window 前提なので useEffect 内で動的 import する（SSR 回避）。
export default function RainRadar({
  lat,
  lon,
  name,
  timezone,
  current,
}: {
  lat: number;
  lon: number;
  name: string;
  timezone: number;
  current: CurrentWeather;
}) {
  const [open, setOpen] = useState(false);
  const [nowLabel, setNowLabel] = useState<string | null>(null);
  const [tileEpoch, setTileEpoch] = useState(precipTileEpoch);
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<CircleMarker | null>(null);
  const rainZoneRef = useRef<Circle | null>(null);

  const isRainingNow = PRECIP_MAINS.has(current.main);

  // 現在時刻は client でのみ算出（SSR とのハイドレーション不一致を避ける）。1分ごとに更新。
  useEffect(() => {
    setNowLabel(nowInCity(timezone));
    const id = setInterval(() => setNowLabel(nowInCity(timezone)), 60_000);
    return () => clearInterval(id);
  }, [timezone]);

  // 降水タイルは10分ごとに再取得
  useEffect(() => {
    const id = setInterval(() => setTileEpoch(precipTileEpoch()), 600_000);
    return () => clearInterval(id);
  }, []);

  // 表示トグルに合わせて地図を生成/破棄
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapElRef.current || mapRef.current) return;

      const map = L.map(mapElRef.current, {
        center: [lat, lon],
        zoom: 9,
        scrollWheelZoom: false,
      });
      mapRef.current = map;

      // 地図の色味を抑えたベースにして降水レイヤーを目立たせる
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      // 雲レイヤー（薄く）— 降水と重ねて雨域の輪郭を補助
      L.tileLayer(`/api/tiles/clouds_new/{z}/{x}/{y}?t=${tileEpoch}`, {
        opacity: 0.35,
        maxZoom: 18,
        className: "radar-cloud-tiles",
      }).addTo(map);

      // 雨雲（降水）レイヤー — サーバー経由でキーを隠す
      L.tileLayer(`/api/tiles/precipitation_new/{z}/{x}/{y}?t=${tileEpoch}`, {
        opacity: 1,
        maxZoom: 18,
        className: "radar-precip-tiles",
      }).addTo(map);

      markerRef.current = L.circleMarker([lat, lon], {
        radius: 9,
        color: "#ffffff",
        weight: 2.5,
        fillColor: "#ff5a5a",
        fillOpacity: 0.95,
      }).addTo(map);

      if (isRainingNow) {
        rainZoneRef.current = L.circle([lat, lon], {
          radius: 12_000,
          color: "#2563eb",
          weight: 2,
          dashArray: "8 6",
          fillColor: "#3b82f6",
          fillOpacity: 0.18,
        }).addTo(map);
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        rainZoneRef.current = null;
      }
    };
    // 開閉・タイル更新・実況の雨で地図を再構築。位置変更は下の effect で追従。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tileEpoch, isRainingNow]);

  // 場所が変わったら中心とマーカーを移動
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lon], mapRef.current.getZoom());
      markerRef.current?.setLatLng([lat, lon]);
      rainZoneRef.current?.setLatLng([lat, lon]);
    }
  }, [lat, lon]);

  return (
    <section className="radar" aria-label="現在の雨雲レーダー">
      <button
        type="button"
        className="radar-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        🌧️ 現在の雨雲レーダー{open ? "を隠す" : `を表示（${name}周辺）`}
        <span className="radar-caret">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="radar-body">
          <div className="radar-now">
            <span className="radar-live-badge">● LIVE 実況</span>
            <span className="radar-now-text">
              {nowLabel ? `${name}の現在 ${nowLabel} 時点の雨雲` : "現在の雨雲を表示中…"}
            </span>
            {isRainingNow && (
              <span className="radar-local-rain">
                🌧️ この地点の実況: {current.description}
              </span>
            )}
          </div>
          <div ref={mapElRef} className="radar-map" />
          <p className="radar-legend">
            ⚠️ これは<strong>カレンダーで選んだ日付ではなく、いまこの瞬間（リアルタイム）の雨雲</strong>です。
            青〜赤ほど降水が強いことを表します。地図は全球モデル由来のため、
            <strong>小雨や局地的な雨は地図に出ないことがあります</strong>（その場合は上の実況バッジを参照）。
          </p>
        </div>
      )}
    </section>
  );
}
