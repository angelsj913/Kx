"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import ResultPanel from "@/components/ResultPanel";
import { MODE_META } from "@/lib/modes";
import { addHistoryItem, type ToolMode } from "@/lib/history";

const MAX_CHARS = 4000;

export default function GeneratorView({ mode }: { mode: ToolMode }) {
  const meta = MODE_META[mode];
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      if (!res.ok) throw new Error(data?.error ?? "요청에 실패했습니다.");

      setResult(data.text);
      addHistoryItem({
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()),
        mode,
        prompt: trimmed,
        result: data.text,
        createdAt: Date.now(),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Input workspace */}
      <section className="flex flex-col rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-5">
        <h2 className="text-lg font-bold text-slate-100">{meta.label}</h2>
        <p className="mt-1 text-sm text-slate-400">{meta.description}</p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-1 flex-col">
          <div className="relative flex-1">
            <textarea
              value={prompt}
              maxLength={MAX_CHARS}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit();
              }}
              placeholder={meta.placeholder}
              className="h-full min-h-[220px] w-full resize-y rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 pb-9 text-base text-slate-100 outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20"
            />
            <span
              className={`pointer-events-none absolute bottom-3 right-4 text-xs tabular-nums ${
                prompt.length >= MAX_CHARS ? "text-red-400" : "text-slate-500"
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

      {/* Result */}
      <div className="min-h-[360px]">
        <ResultPanel
          content={result}
          loading={loading}
          error={error}
          fileBaseName={mode === "business" ? "business-tone" : "interview-questions"}
        />
      </div>
    </div>
  );
}
