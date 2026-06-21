"use client";

import { useState } from "react";

export default function SearchBar({
  onSearch,
  onGeolocate,
  loading,
}: {
  onSearch: (city: string) => void;
  onGeolocate: () => void;
  loading: boolean;
}) {
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (v) onSearch(v);
  };

  return (
    <form className="search-bar" onSubmit={submit}>
      <div className="search-input-wrap">
        <span className="search-icon" aria-hidden>
          🔍
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="都市名を入力（例: Osaka, London, New York）"
          aria-label="都市名"
          disabled={loading}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        検索
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={onGeolocate}
        disabled={loading}
        title="現在地の天気を表示"
      >
        📍 現在地
      </button>
    </form>
  );
}
