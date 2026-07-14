"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Power, PowerOff, RefreshCw } from "lucide-react";

type AiAdminState = {
  enabled: boolean;
  dailyCap: number | null;
  stats: {
    messages24h: number;
    messages7d: number;
    sessions24h: number;
    disabledUsers: number;
    estTokens24h: number;
  };
  topUsage: {
    userId: string;
    feature: string;
    count: number;
    periodKey: string;
    email: string | null;
    name: string | null;
  }[];
};

export default function AdminAiPage() {
  const [data, setData] = useState<AiAdminState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [capInput, setCapInput] = useState("");
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ai");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "불러오기 실패");
      setData(json);
      setCapInput(json.dailyCap != null ? String(json.dailyCap) : "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ai", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "저장 실패");
      setData(json);
      setCapInput(json.dailyCap != null ? String(json.dailyCap) : "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) {
    return <p className="text-sm text-slate-500">불러오는 중…</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Bot className="h-5 w-5 text-blue-600" />
            AI 관리
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            전역 AI 활성화·비활성화, 사용량 지표, 사용자별 차단
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-white dark:border-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          새로고침
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {data && (
        <>
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold">전역 AI 상태</h2>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  data.enabled
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
                }`}
              >
                {data.enabled ? (
                  <>
                    <Power className="h-3.5 w-3.5" /> 활성
                  </>
                ) : (
                  <>
                    <PowerOff className="h-3.5 w-3.5" /> 비활성
                  </>
                )}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void patch({ enabled: !data.enabled })}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                  data.enabled
                    ? "bg-rose-600 hover:bg-rose-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                {data.enabled ? "AI 비활성화" : "AI 활성화"}
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              비활성화 시 채팅·퀵툴 API가 503으로 차단됩니다. 토큰 한도와 무관한 운영 스위치입니다.
            </p>
          </section>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "24h 응답 수", value: data.stats.messages24h },
              { label: "7일 응답 수", value: data.stats.messages7d },
              { label: "24h 세션", value: data.stats.sessions24h },
              {
                label: "추정 토큰(24h)",
                value: data.stats.estTokens24h.toLocaleString(),
              },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-2xl font-bold tabular-nums">{c.value}</p>
                <p className="mt-1 text-xs text-slate-500">{c.label}</p>
              </div>
            ))}
          </div>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold">일일 요청 상한 (참고 설정)</h2>
            <p className="mt-1 text-xs text-slate-500">
              비워 두면 무제한. 값은 SystemConfig에 저장되며 운영 참고용입니다.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={capInput}
                onChange={(e) => setCapInput(e.target.value.replace(/\D/g, ""))}
                placeholder="예: 10000"
                className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void patch({
                    dailyCap: capInput === "" ? null : Number(capInput),
                  })
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                저장
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              차단된 사용자: {data.stats.disabledUsers}명
            </p>
          </section>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold">사용자 AI 차단</h2>
            <p className="mt-1 text-xs text-slate-500">User ID로 AI 비활성 토글</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value.trim())}
                placeholder="userId"
                className="min-w-[16rem] flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950"
              />
              <button
                type="button"
                disabled={busy || !userId}
                onClick={() => void patch({ userId, aiDisabled: true })}
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                차단
              </button>
              <button
                type="button"
                disabled={busy || !userId}
                onClick={() => void patch({ userId, aiDisabled: false })}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                해제
              </button>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold">이번 달 사용량 상위</h2>
            <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {data.topUsage.length === 0 && (
                <li className="py-6 text-center text-sm text-slate-500">데이터 없음</li>
              )}
              {data.topUsage.map((u) => (
                <li
                  key={`${u.userId}-${u.feature}`}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {u.name || u.email || u.userId.slice(0, 8)}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {u.feature} · {u.userId}
                    </p>
                  </div>
                  <span className="tabular-nums font-semibold">{u.count}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
