"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Database, FileText, Loader2, Check, Sparkles, RefreshCw } from "lucide-react";
import { useWorkspace, wsFetch } from "@/lib/workspaceClient";
import { useT } from "@/lib/i18n";

interface LibraryItemSummary {
  id: string;
  title: string;
  fileName: string;
  _count?: { chunks: number };
}
interface Source {
  n: number;
  libraryItemId: string;
  title: string;
  snippet: string;
  score: number;
}

export default function RagView() {
  const t = useT();
  const { activeId } = useWorkspace();
  const [items, setItems] = useState<LibraryItemSummary[]>([]);
  const [chunkCounts, setChunkCounts] = useState<Record<string, number>>({});
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [provider, setProvider] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await wsFetch("/api/library");
      const data = await res.json();
      if (cancelled || !res.ok) return;
      const list: LibraryItemSummary[] = data.items ?? [];
      setItems(list);
      setChunkCounts(
        Object.fromEntries(list.map((it) => [it.id, it._count?.chunks ?? 0])),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  async function retryIndex(id: string) {
    setRetrying((s) => ({ ...s, [id]: true }));
    setError("");
    try {
      const res = await wsFetch("/api/rag/index", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ libraryItemId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? t("rag.errors.indexFailed"));
        return;
      }
      setChunkCounts((s) => ({ ...s, [id]: data.chunks }));
    } finally {
      setRetrying((s) => ({ ...s, [id]: false }));
    }
  }

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim() || searching) return;
    setSearching(true);
    setError("");
    setAnswer("");
    setSources([]);
    try {
      const res = await wsFetch("/api/rag/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? t("rag.errors.searchFailed"));
        return;
      }
      setAnswer(data.answer ?? "");
      setSources(data.sources ?? []);
      setProvider(data.provider ?? "");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col overflow-y-auto px-4 py-8 sm:px-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-50">
          <Database className="h-5 w-5 text-[var(--mode-accent)]" />
          {t("rag.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("rag.subtitle")}
        </p>
      </div>

      <form onSubmit={search} className="mt-5 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700/60 dark:bg-slate-900/60">
          <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("rag.searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-600"
          />
        </div>
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 disabled:opacity-50"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {t("rag.search")}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {answer && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-2xl border border-blue-300 bg-white p-5 dark:border-blue-500/30 dark:bg-slate-800/50"
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-100">
            {answer}
          </p>
          {sources.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-700/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("rag.sourcesLabel")} {provider === "local" ? t("rag.localEmbedding") : ""}
              </p>
              {sources.map((s) => (
                <div key={s.n} className="rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900/50">
                  <p className="mb-0.5 font-medium text-blue-700 dark:text-blue-300">
                    [{s.n}] {s.title} <span className="text-slate-400 dark:text-slate-600">· {s.score}</span>
                  </p>
                  <p className="line-clamp-2 text-slate-500 dark:text-slate-400">{s.snippet}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <div className="mt-8">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t("rag.indexSectionTitle")}
        </h2>
        {items.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700/50 dark:bg-slate-800/30">
            {t("rag.indexSectionHint")}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((it) => {
              const chunks = chunkCounts[it.id] ?? 0;
              const isSearchable = chunks > 0;
              return (
                <li
                  key={it.id}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700/50 dark:bg-slate-800/30"
                >
                  <FileText className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-slate-800 dark:text-slate-100">
                      {it.title}
                    </span>
                  </span>
                  {isSearchable ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <Check className="h-3.5 w-3.5" />
                      {t("rag.searchableBadge")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => retryIndex(it.id)}
                      disabled={retrying[it.id]}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-blue-500/50 disabled:opacity-50 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-400"
                    >
                      {retrying[it.id] ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      {retrying[it.id] ? t("rag.pendingBadge") : t("rag.retryIndex")}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
