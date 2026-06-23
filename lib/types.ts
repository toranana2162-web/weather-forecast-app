export type HourlyForecast = {
  time: { date: string; hour: number };
  temp: number;
  humidity: number;
  pop: number;
  description: string;
  icon: string;
};

export type DailyForecast = {
  date: string;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pop: number;
  description: string;
  icon: string;
  main: string;
  hourly: HourlyForecast[];
};

export type CurrentWeather = {
  date: string;
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pop: number;
  description: string;
  icon: string;
  main: string;
  windSpeed: number;
};

export type WeatherResponse = {
  location: { name: string; country: string; lat?: number; lon?: number };
  timezone: number;
  current: CurrentWeather;
  daily: DailyForecast[];
};

// お気に入り都市（localStorage に保存）
export type FavoriteCity = {
  name: string;
  country: string;
  lat: number;
  lon: number;
};

// AI 服装・持ち物提案
export type OutfitAdvice = {
  summary: string;
  clothing: string[];
  items: string[];
};
