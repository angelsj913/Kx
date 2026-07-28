"use client";

import { ExternalLink, FileText, Globe } from "lucide-react";
import { useT } from "@/lib/i18n";

export interface Citation {
  n: number;
  title: string;
  snippet: string;
  score?: number;
  libraryItemId?: string;
  url?: string;
  source?: "library" | "web";
}

function normalizeCitation(raw: Citation): Citation {
  const source =
    raw.source ??
    (raw.url && !raw.libraryItemId ? "web" : "library");
  return { ...raw, source };
}

export default function CitationCards({ citations }: { citations: Citation[] }) {
  const t = useT();
  const items = citations.map(normalizeCitation);
  if (!items.length) return null;

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t("chat.citations.heading")}
      </p>
      <div className="flex flex-col gap-1.5">
        {items.map((c) => {
          const isWeb = c.source === "web";
          const label = isWeb ? `web-${c.n}` : String(c.n);
          const TitleIcon = isWeb ? Globe : FileText;

          return (
            <div
              key={`${c.source ?? "library"}-${c.n}-${c.title}`}
              className="flex gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-800/50"
            >
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded bg-[var(--mode-accent)]/15 px-1 text-[10px] font-bold text-[var(--mode-accent)]">
                {label}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <TitleIcon className="h-3 w-3 shrink-0 text-slate-400" />
                  {isWeb && c.url ? (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-[11px] font-medium text-[var(--mode-accent)] hover:underline"
                    >
                      {c.title}
                    </a>
                  ) : (
                    <span className="truncate text-[11px] font-medium text-slate-700 dark:text-slate-200">
                      {c.title}
                    </span>
                  )}
                  {typeof c.score === "number" && (
                    <span className="shrink-0 text-[10px] text-slate-400">
                      {(c.score * 100).toFixed(0)}%
                    </span>
                  )}
                  {isWeb && c.url && (
                    <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
                  )}
                </div>
                <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {c.snippet}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function parseCitationsFromResultData(resultData?: string | null): Citation[] {
  if (!resultData) return [];
  try {
    const parsed = JSON.parse(resultData) as { citations?: Citation[] };
    if (!Array.isArray(parsed.citations)) return [];
    return parsed.citations.map((c) => normalizeCitation(c));
  } catch {
    return [];
  }
}
