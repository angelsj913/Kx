"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Database, FileText, Loader2, Check, Sparkles } from "lucide-react";
import { useWorkspace, wsFetch } from "@/lib/workspaceClient";

interface LibraryItemSummary {
  id: string;
  title: string;
  fileName: string;
}
interface Source {
  n: number;
  libraryItemId: string;
  title: string;
  snippet: string;
  score: number;
}

export default function RagView() {
  const { activeId } = useWorkspace();
  const [items, setItems] = useState<LibraryItemSummary[]>([]);
  const [indexing, setIndexing] = useState<Record<string, boolean>>({});
  const [indexed, setIndexed] = useState<Record<string, number>>({});

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
      if (!cancelled && res.ok) setItems(data.items ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  async function indexItem(id: string) {
    setIndexing((s) => ({ ...s, [id]: true }));
    setError("");
    try {
      const res = await wsFetch("/api/rag/index", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ libraryItemId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "색인 실패");
        return;
      }
      setIndexed((s) => ({ ...s, [id]: data.chunks }));
    } finally {
      setIndexing((s) => ({ ...s, [id]: false }));
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
        setError(data?.error ?? "검색 실패");
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
          지식 검색 (RAG)
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          서재 문서를 색인하고, 그 내용을 근거로 답을 찾아드려요.
        </p>
      </div>

      {/* 검색 */}
      <form onSubmit={search} className="mt-5 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700/60 dark:bg-slate-900/60">
          <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="문서에 대해 무엇이든 물어보세요"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-600"
          />
        </div>
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 disabled:opacity-50"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          검색
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {/* 답변 */}
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
                근거 {provider === "local" ? "· (로컬 임베딩)" : ""}
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

      {/* 문서 색인 */}
      <div className="mt-8">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          문서 색인
        </h2>
        {items.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700/50 dark:bg-slate-800/30">
            서재에 자료를 올리면 여기서 색인할 수 있어요.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700/50 dark:bg-slate-800/30"
              >
                <FileText className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-slate-800 dark:text-slate-100">
                    {it.title}
                  </span>
                  {indexed[it.id] !== undefined && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      {indexed[it.id]}개 청크 색인됨
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => indexItem(it.id)}
                  disabled={indexing[it.id]}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-500/50 disabled:opacity-50 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
                >
                  {indexing[it.id] ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : indexed[it.id] !== undefined ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Database className="h-3.5 w-3.5" />
                  )}
                  {indexed[it.id] !== undefined ? "재색인" : "색인"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
