"use client";

import { useEffect, useState } from "react";

type PredictData = {
  score: number;
  riskLevel: string;
  recommendations: string[];
  openThreats: number;
};

export function PredictPanel() {
  const [data, setData] = useState<PredictData | null>(null);

  useEffect(() => {
    fetch("/api/admin/security/predict")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return <p className="text-sm text-slate-500">분석 로딩…</p>;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-semibold">위험 예측 리포트</h2>
      <p className="mt-2 text-3xl font-bold tabular-nums">{data.score}</p>
      <p className="text-xs text-slate-500">리스크 점수 (0–100) · {data.riskLevel}</p>
      <p className="mt-2 text-xs">미해결 위험 {data.openThreats}건</p>
      <ul className="mt-4 list-disc space-y-1 pl-4 text-sm text-slate-600 dark:text-slate-300">
        {data.recommendations.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </section>
  );
}
