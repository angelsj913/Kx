"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  Briefcase,
  MessagesSquare,
  Copy,
  Check,
  AlertTriangle,
  Wand2,
  FileText,
} from "lucide-react";

type Mode = "business" | "interview";

const MAX_CHARS = 2000;

const MODES: {
  id: Mode;
  label: string;
  icon: typeof Briefcase;
  description: string;
  placeholder: string;
}[] = [
  {
    id: "business",
    label: "비즈니스 말투 변환기",
    icon: Briefcase,
    description:
      "두서없거나 감정적인 글을 이메일·슬랙에 어울리는 정중하고 세련된 비즈니스 말투로 변환합니다.",
    placeholder:
      "예) 이거 언제까지 해야 되는지 아무도 말 안 해줘서 진짜 답답한데 좀 알려주세요...",
  },
  {
    id: "interview",
    label: "자소서 면접 질문기",
    icon: MessagesSquare,
    description:
      "자기소개서를 분석해 날카로운 압박 꼬리 질문 3가지와 실전 답변 가이드를 제시합니다.",
    placeholder:
      "예) 저는 대학 시절 학회 활동을 통해 리더십을 길렀고, 팀 프로젝트에서 갈등을 조율한 경험이 있습니다...",
  },
];

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="skeleton-shimmer h-5 w-1/3 rounded-md" />
      <div className="skeleton-shimmer h-4 w-full rounded-md" />
      <div className="skeleton-shimmer h-4 w-11/12 rounded-md" />
      <div className="skeleton-shimmer h-4 w-4/5 rounded-md" />
      <div className="skeleton-shimmer mt-5 h-5 w-1/4 rounded-md" />
      <div className="skeleton-shimmer h-4 w-full rounded-md" />
      <div className="skeleton-shimmer h-4 w-3/4 rounded-md" />
    </div>
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("business");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeIndex = MODES.findIndex((m) => m.id === mode);
  const activeMode = MODES[activeIndex];

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
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
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* ambient background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[24rem] w-[24rem] rounded-full bg-indigo-600/10 blur-[120px]" />

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-4 sm:px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-50 sm:text-lg">
              AI 툴킷
            </h1>
            <p className="text-xs text-slate-400">직장인·취준생을 위한 AI 어시스턴트</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Main workspace card */}
        <section className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-6">
          {/* Sliding tabs */}
          <div className="relative grid grid-cols-2 gap-1 rounded-xl border border-slate-700/50 bg-slate-900/60 p-1">
            <div
              className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-900/40 transition-all duration-300 ease-out"
              style={{ left: activeIndex === 0 ? "0.25rem" : "calc(50% + 0rem)" }}
            />
            {MODES.map((m) => {
              const active = m.id === mode;
              const Icon = m.icon;
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
                  className={`relative z-10 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-300 ${
                    active
                      ? "text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{m.label}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-slate-400">{activeMode.description}</p>

          {/* Input */}
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="relative">
              <textarea
                value={prompt}
                maxLength={MAX_CHARS}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter")
                    handleSubmit();
                }}
                placeholder={activeMode.placeholder}
                rows={7}
                className="w-full resize-y rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 pb-9 text-base text-slate-100 outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20"
              />
              <span
                className={`pointer-events-none absolute bottom-3 right-4 text-xs tabular-nums ${
                  prompt.length >= MAX_CHARS
                    ? "text-red-400"
                    : "text-slate-500"
                }`}
              >
                {prompt.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-900/40 transition-all duration-300 hover:scale-[1.02] hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
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
                  AI가 작업 중...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  AI 마법 적용하기
                </>
              )}
            </button>
          </form>
        </section>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-300 backdrop-blur-md"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Output area */}
        <section className="mt-5 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              <FileText className="h-4 w-4 text-violet-400" />
              결과
            </h2>
            {result && !loading && (
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all duration-300 hover:border-violet-500/50 hover:text-violet-300"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    복사하기
                  </>
                )}
              </button>
            )}
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : result ? (
            <div className="prose-ai max-w-none text-sm sm:text-base">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-900/60">
                <Sparkles className="h-7 w-7 text-slate-600" />
              </div>
              <p className="text-sm text-slate-500">
                텍스트를 입력하고 <span className="text-violet-400">AI 마법 적용하기</span>를
                누르면
                <br />
                결과가 여기에 표시됩니다.
              </p>
            </div>
          )}
        </section>

        <footer className="mt-8 text-center text-xs text-slate-600">
          Powered by Google Gemini · API 키는 서버에서만 사용됩니다
        </footer>
      </main>
    </div>
  );
}
