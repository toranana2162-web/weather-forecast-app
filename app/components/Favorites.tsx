"use client";

import type { FavoriteCity } from "@/lib/types";

export default function Favorites({
  favorites,
  onSelect,
  onRemove,
  loading,
}: {
  favorites: FavoriteCity[];
  onSelect: (city: FavoriteCity) => void;
  onRemove: (city: FavoriteCity) => void;
  loading: boolean;
}) {
  if (favorites.length === 0) return null;

  return (
    <section className="favorites" aria-label="お気に入り都市">
      <h2 className="section-title">⭐ お気に入り</h2>
      <div className="fav-strip">
        {favorites.map((f) => (
          <div key={`${f.lat},${f.lon}`} className="fav-chip">
            <button
              type="button"
              className="fav-chip-main"
              onClick={() => onSelect(f)}
              disabled={loading}
              title={`${f.name} の天気を表示`}
            >
              📍 {f.name}
            </button>
            <button
              type="button"
              className="fav-chip-remove"
              onClick={() => onRemove(f)}
              aria-label={`${f.name} をお気に入りから削除`}
              title="削除"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
