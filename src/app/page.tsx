"use client";

import { useState } from "react";

type Mode = "business" | "interview";

const MODES: {
  id: Mode;
  label: string;
  description: string;
  placeholder: string;
}[] = [
  {
    id: "business",
    label: "비즈니스 말투 변환기",
    description: "두서없거나 감정적인 글을 정중하고 세련된 비즈니스 말투로 바꿔드립니다.",
    placeholder:
      "예) 이거 언제까지 해야 되는지 아무도 말 안 해줘서 진짜 답답한데 좀 알려주세요...",
  },
  {
    id: "interview",
    label: "자소서 면접 질문 생성기",
    description: "자기소개서 내용을 분석해 날카로운 꼬리 질문 3가지와 답변 가이드를 제시합니다.",
    placeholder:
      "예) 저는 대학 시절 학회 활동을 통해 리더십을 길렀고, 팀 프로젝트에서 갈등을 조율한 경험이 있습니다...",
  },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("business");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeMode = MODES.find((m) => m.id === mode)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, mode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "요청에 실패했습니다.");
      }
      setResult(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10 dark:from-slate-950 dark:to-slate-900 sm:py-16">
      <div className="w-full max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
            AI 어시스턴트
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            원하는 기능을 선택하고 텍스트를 입력하면 Gemini AI가 처리해 드립니다.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
        >
          <div
            role="tablist"
            aria-label="기능 선택"
            className="mb-4 grid grid-cols-1 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 sm:grid-cols-2"
          >
            {MODES.map((m) => {
              const active = m.id === mode;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setMode(m.id);
                    setError("");
                    setResult("");
                  }}
                  className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-white text-indigo-600 shadow dark:bg-slate-900 dark:text-indigo-400"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            {activeMode.description}
          </p>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit(e);
            }}
            placeholder={activeMode.placeholder}
            rows={6}
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-base text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-indigo-900"
          />

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:from-indigo-600 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg
                  className="h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                생성 중...
              </>
            ) : (
              "AI에게 요청하기"
            )}
          </button>
        </form>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300"
          >
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {result && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              AI 응답
            </h2>
            <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-800 dark:text-slate-100">
              {result}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
