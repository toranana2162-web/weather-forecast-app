# ⛅ お天気予報アプリ (Weather Forecast App)

任意の都市・現在地の **気温 / 天気 / 湿度 / 降水確率** を表示し、**カレンダーで日付を切り替えて予報を確認**できる Web アプリです。Next.js (App Router) 製で、Vercel にデプロイできます。

## ✨ 機能

- 🔍 都市名検索（例: `Tokyo`, `Osaka`, `London`, `New York`）
- 📍 現在地の天気（ブラウザの位置情報を利用）
- 🌡️ 気温（現在・最高・最低・体感）、☁️ 天気、💧 湿度、☔ 降水確率
- 📅 カレンダーで日付を選んで予報を切り替え（当日＋向こう数日）
- 🕒 3時間ごとの詳細予報
- 🎨 天気に応じて背景が変わるリッチな UI（日本語）

## 🔐 API キーの扱い

OpenWeatherMap の API キーは **サーバー側の API ルート (`app/api/weather/route.ts`) でのみ使用**し、ブラウザには一切渡しません。キーは環境変数 `OPENWEATHER_API_KEY` で管理し、コードに直書きしません。

## 🛠️ ローカル開発

1. 依存関係をインストール

   ```bash
   npm install
   ```

2. OpenWeatherMap の API キーを取得
   - https://home.openweathermap.org/users/sign_up で無料登録
   - https://home.openweathermap.org/api_keys でキーを発行
   - ※ 発行直後は有効化に最大1〜2時間ほどかかる場合があります

3. 環境変数ファイルを作成

   ```bash
   cp .env.local.example .env.local
   ```

   `.env.local` を開き、発行したキーを設定します。

   ```
   OPENWEATHER_API_KEY=取得したキー
   ```

4. 開発サーバーを起動

   ```bash
   npm run dev
   ```

   http://localhost:3000 を開きます。

## ☁️ Vercel へのデプロイ

1. GitHub リポジトリを Vercel にインポート（または `vercel` CLI を使用）
2. **Project Settings → Environment Variables** で `OPENWEATHER_API_KEY` を設定
3. デプロイ

> `.env.local` は `.gitignore` で除外されており、キーがリポジトリに含まれることはありません。

## 📦 技術スタック

- [Next.js 15](https://nextjs.org/) (App Router) / React 19 / TypeScript
- [OpenWeatherMap API](https://openweathermap.org/api)（Current Weather + 5 day / 3 hour forecast：無料プラン）

## 📁 ディレクトリ構成

```
app/
  api/weather/route.ts   # サーバー側API（APIキーを使用）
  components/            # UIコンポーネント
  page.tsx              # メイン画面
  layout.tsx
  globals.css
lib/
  types.ts
  utils.ts
```
