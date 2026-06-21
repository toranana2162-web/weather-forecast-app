import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "お天気予報 | Weather Forecast",
  description:
    "任意の都市や現在地の気温・天気・湿度・降水確率を表示。カレンダーで日付を切り替えて予報を確認できます。",
};

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
