import type { FavoriteCity } from "./types";

const KEY = "weather:favorites";

// localStorage はクライアントのみ。SSR では空配列を返す。
export function loadFavorites(): FavoriteCity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FavoriteCity[]) : [];
  } catch {
    return [];
  }
}

function save(list: FavoriteCity[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // 容量超過などは無視
  }
}

// 同一地点の判定は緯度経度を小数2桁に丸めて比較（同じ都市の微小差を吸収）
function sameCity(a: FavoriteCity, b: FavoriteCity): boolean {
  return a.lat.toFixed(2) === b.lat.toFixed(2) && a.lon.toFixed(2) === b.lon.toFixed(2);
}

export function isFavorite(list: FavoriteCity[], city: FavoriteCity): boolean {
  return list.some((f) => sameCity(f, city));
}

export function addFavorite(list: FavoriteCity[], city: FavoriteCity): FavoriteCity[] {
  if (isFavorite(list, city)) return list;
  const next = [...list, city];
  save(next);
  return next;
}

export function removeFavorite(list: FavoriteCity[], city: FavoriteCity): FavoriteCity[] {
  const next = list.filter((f) => !sameCity(f, city));
  save(next);
  return next;
}
