"use client";

import { useCallback, useEffect, useState } from "react";
import { Lightbulb, Sparkles, Pin, Trash2, Loader2, FileText } from "lucide-react";
import { useT } from "@/lib/i18n";

interface InsightCard {
  id: string;
  title: string;
  summary: string;
  keyPoints: string; // JSON 배열 문자열
  sourceName: string | null;
  libraryItemId: string | null;
  pinned: boolean;
  createdAt: string;
}

interface LibItem {
  id: string;
  title: string;
}

/** keyPoints JSON을 안전하게 문자열 배열로 파싱. */
function parsePoints(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map((x) => String(x)) : [];
  } catch {
    return [];
  }
}

export default function InsightBoardView() {
  const t = useT();
  const [cards, setCards] = useState<InsightCard[]>([]);
  const [items, setItems] = useState<LibItem[]>([]);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [i, l] = await Promise.all([
      fetch("/api/insights").then((r) => r.json()).catch(() => ({})),
      fetch("/api/library").then((r) => r.json()).catch(() => ({})),
    ]);
    if (Array.isArray(i.insights)) setCards(i.insights);
    if (Array.isArray(l.items)) setItems(l.items.map((x: LibItem) => ({ id: x.id, title: x.title })));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await load();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function generate() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ libraryItemId: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t("common.error"));
      if (data.insight) setCards((prev) => [data.insight, ...prev]);
      setSelected("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function togglePin(id: string) {
    const res = await fetch("/api/insights", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) await load();
  }

  async function remove(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id));
    await fetch("/api/insights", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-y-auto px-4 py-6 sm:px-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 dark:bg-amber-500/15 dark:text-amber-300">
          <Lightbulb className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
            {t("sidebar.insightBoard")}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t("insight.subtitle")}</p>
        </div>
      </div>

      {/* 생성기 */}
      <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-blue-200 bg-blue-50/60 p-3 sm:flex-row sm:items-center dark:border-blue-500/30 dark:bg-blue-500/10">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={items.length === 0 || busy}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">
            {items.length === 0 ? t("insight.noDocs") : t("insight.pickDoc")}
          </option>
          {items.map((it) => (
            <option key={it.id} value={it.id}>
              {it.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={!selected || busy}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {busy ? t("insight.generating") : t("insight.generate")}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {/* 카드 목록 */}
      <div className="mt-5 flex-1">
        {loading ? (
          <p className="py-16 text-center text-sm text-slate-400 dark:text-slate-500">
            {t("common.loading")}
          </p>
        ) : cards.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {t("insight.empty")}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((card) => {
              const points = parsePoints(card.keyPoints);
              return (
                <div
                  key={card.id}
                  className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition-colors dark:bg-slate-900 dark:shadow-none ${
                    card.pinned
                      ? "border-amber-300 dark:border-amber-500/40"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 text-sm font-bold text-slate-900 dark:text-slate-50">
                      {card.title}
                    </h3>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => void togglePin(card.id)}
                        title="pin"
                        className={`rounded-lg p-1.5 transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/40 ${
                          card.pinned ? "text-amber-500" : "text-slate-300 dark:text-slate-600"
                        }`}
                      >
                        <Pin className="h-3.5 w-3.5" fill={card.pinned ? "currentColor" : "none"} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(card.id)}
                        title={t("common.delete")}
                        className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-slate-600 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {card.sourceName && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                      <FileText className="h-3 w-3 shrink-0" />
                      <span className="truncate">{card.sourceName}</span>
                    </p>
                  )}

                  <p className="mt-2.5 whitespace-pre-wrap text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {card.summary}
                  </p>

                  {points.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        {t("insight.keyPoints")}
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {points.map((p, i) => (
                          <li
                            key={i}
                            className="flex gap-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300"
                          >
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
