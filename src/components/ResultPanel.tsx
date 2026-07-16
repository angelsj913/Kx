"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  Sparkles,
  Copy,
  Check,
  Download,
  AlertTriangle,
} from "lucide-react";
import { useT } from "@/lib/i18n";

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

const FONT_STEPS = [0.875, 1, 1.125, 1.25, 1.4];

export default function ResultPanel({
  content,
  loading = false,
  error = "",
  fileBaseName = "ai-result",
}: {
  content: string;
  loading?: boolean;
  error?: string;
  fileBaseName?: string;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [fontIdx, setFontIdx] = useState(1);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
    };
  }, []);

  function handleCopy() {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleExport() {
    if (!content) return;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `${fileBaseName}-${stamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const hasResult = !!content && !loading;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-black/40 dark:backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5 dark:border-slate-800">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Sparkles className="h-4 w-4 text-[var(--mode-accent)]" />
          {t("fileResult.defaultTitle")}
        </h2>
        {hasResult && (
          <div className="flex items-center gap-1.5">
            <div className="mr-1 flex items-center overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700">
              <button
                type="button"
                aria-label={t("resultPanel.fontSmaller")}
                onClick={() => setFontIdx((i) => Math.max(0, i - 1))}
                disabled={fontIdx === 0}
                className="px-2 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700/50"
              >
                A-
              </button>
              <span className="border-x border-slate-300 dark:border-slate-700 px-2 py-1.5 text-[11px] font-medium text-slate-500">
                {t("resultPanel.fontSample")}
              </span>
              <button
                type="button"
                aria-label={t("resultPanel.fontLarger")}
                onClick={() =>
                  setFontIdx((i) => Math.min(FONT_STEPS.length - 1, i + 1))
                }
                disabled={fontIdx === FONT_STEPS.length - 1}
                className="px-2 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700/50"
              >
                A+
              </button>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-900/60 dark:text-slate-300 transition-all duration-300 hover:border-[var(--mode-accent)]/50 hover:text-[var(--mode-accent)]"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  {t("chat.copied")}
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  {t("chat.copy")}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-900/60 dark:text-slate-300 transition-all duration-300 hover:border-[var(--mode-accent)]/50 hover:text-[var(--mode-accent)]"
            >
              <Download className="h-3.5 w-3.5" />
              {t("resultPanel.saveTxt")}
            </button>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500 dark:text-red-400" />
            <span>{error}</span>
          </div>
        ) : loading ? (
          <LoadingSkeleton />
        ) : content ? (
          <div
            className="prose-ai max-w-none"
            style={{ fontSize: `${FONT_STEPS[fontIdx]}rem` }}
          >
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
              <Sparkles className="h-7 w-7 text-slate-400 dark:text-slate-600" />
            </div>
            <p className="text-sm text-slate-500">
              {t("resultPanel.emptyLine1")}
              <br />
              {t("fileResult.emptyResult")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
