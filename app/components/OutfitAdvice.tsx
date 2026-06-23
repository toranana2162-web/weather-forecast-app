"use client";

import { useState } from "react";
import type { OutfitAdvice as Advice } from "@/lib/types";

// AI（Claude）に服装・持ち物を提案してもらう。ボタン押下時のみ呼び出す（自動でトークンを消費しない）。
export default function OutfitAdvice({ input }: { input: Record<string, unknown> }) {
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const fetchAdvice = async () => {
    setLoading(true);
    setError(null);
    setNotConfigured(false);
    try {
      const res = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.notConfigured) setNotConfigured(true);
        throw new Error(json.error || "AI提案の取得に失敗しました。");
      }
      setAdvice(json as Advice);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました。");
      setAdvice(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="advice" aria-label="AIによる服装・持ち物提案">
      <h2 className="section-title">🤖 AIのおすすめ（服装・持ち物）</h2>

      {!advice && (
        <button
          type="button"
          className="btn btn-primary advice-btn"
          onClick={fetchAdvice}
          disabled={loading}
        >
          {loading ? "AIが考え中…" : "この日の服装・持ち物を提案してもらう"}
        </button>
      )}

      {error && (
        <div className={`advice-note ${notConfigured ? "" : "advice-error"}`}>
          {notConfigured ? "🔑 " : "⚠️ "}
          {error}
        </div>
      )}

      {advice && (
        <div className="advice-card">
          <p className="advice-summary">{advice.summary}</p>
          <div className="advice-cols">
            <div className="advice-col">
              <div className="advice-col-title">👕 服装</div>
              <ul className="advice-list">
                {advice.clothing.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="advice-col">
              <div className="advice-col-title">🎒 持ち物</div>
              <ul className="advice-list">
                {advice.items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost advice-again"
            onClick={fetchAdvice}
            disabled={loading}
          >
            {loading ? "…" : "🔄 もう一度提案"}
          </button>
        </div>
      )}
    </section>
  );
}
