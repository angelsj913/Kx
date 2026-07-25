"use client";

import { FileText } from "lucide-react";

export interface Citation {
  n: number;
  title: string;
  snippet: string;
  score: number;
  libraryItemId?: string;
}

export default function CitationCards({ citations }: { citations: Citation[] }) {
  if (!citations.length) return null;

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        참고 출처
      </p>
      <div className="flex flex-col gap-1.5">
        {citations.map((c) => (
          <div
            key={c.n}
            className="flex gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-800/50"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--mode-accent)]/15 text-[10px] font-bold text-[var(--mode-accent)]">
              {c.n}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="truncate text-[11px] font-medium text-slate-700 dark:text-slate-200">
                  {c.title}
                </span>
                <span className="shrink-0 text-[10px] text-slate-400">
                  {(c.score * 100).toFixed(0)}%
                </span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                {c.snippet}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function parseCitationsFromResultData(resultData?: string | null): Citation[] {
  if (!resultData) return [];
  try {
    const parsed = JSON.parse(resultData) as { citations?: Citation[] };
    return Array.isArray(parsed.citations) ? parsed.citations : [];
  } catch {
    return [];
  }
}
