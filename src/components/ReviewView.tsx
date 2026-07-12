"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Plus, Sparkles, Trash2, Check, Loader2, RotateCcw } from "lucide-react";
import { useWorkspace, wsFetch } from "@/lib/workspaceClient";
import type { ReviewGrade } from "@/lib/srs";

interface Card {
  id: string;
  front: string;
  back: string;
  dueAt: string;
  repetitions: number;
  intervalDays: number;
  libraryItemId: string | null;
}
interface LibraryItemSummary {
  id: string;
  title: string;
}

const GRADES: { grade: ReviewGrade; label: string; cls: string }[] = [
  { grade: "again", label: "다시", cls: "bg-red-600/80 hover:bg-red-600" },
  { grade: "hard", label: "어려움", cls: "bg-amber-600/80 hover:bg-amber-600" },
  { grade: "good", label: "알맞음", cls: "bg-emerald-600/80 hover:bg-emerald-600" },
  { grade: "easy", label: "쉬움", cls: "bg-sky-600/80 hover:bg-sky-600" },
];

export default function ReviewView() {
  const { activeId } = useWorkspace();
  const [queue, setQueue] = useState<Card[]>([]);
  const [stats, setStats] = useState({ total: 0, due: 0 });
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [error, setError] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [saving, setSaving] = useState(false);

  const [showGen, setShowGen] = useState(false);
  const [libraryItems, setLibraryItems] = useState<LibraryItemSummary[]>([]);
  const [genItemId, setGenItemId] = useState("");
  const [genCount, setGenCount] = useState(10);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await wsFetch("/api/review/cards");
      const data = await res.json();
      if (res.ok) {
        setQueue(data.cards ?? []);
        setStats(data.stats ?? { total: 0, due: 0 });
        setFlipped(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, activeId]);

  const current = queue[0] ?? null;

  async function grade(g: ReviewGrade) {
    if (!current) return;
    const card = current;
    setFlipped(false);
    setReviewed((n) => n + 1);
    // 큐에서 제거하고, "다시"면 세션 끝에 다시 넣어 재복습
    setQueue((prev) => {
      const rest = prev.slice(1);
      return g === "again" ? [...rest, card] : rest;
    });
    await wsFetch(`/api/review/cards/${card.id}/grade`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ grade: g }),
    });
    setStats((s) => ({ ...s, due: Math.max(0, s.due - 1) }));
  }

  async function addCard() {
    if (!front.trim() || !back.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await wsFetch("/api/review/cards", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ front, back }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d?.error ?? "저장 실패");
        return;
      }
      setFront("");
      setBack("");
      setShowAdd(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function openGenerate() {
    setShowGen(true);
    const res = await wsFetch("/api/library");
    const data = await res.json();
    if (res.ok) {
      setLibraryItems(data.items ?? []);
      if (data.items?.[0]) setGenItemId(data.items[0].id);
    }
  }

  async function generate() {
    if (!genItemId || generating) return;
    setGenerating(true);
    setError("");
    try {
      const res = await wsFetch("/api/review/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ libraryItemId: genItemId, count: genCount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "생성 실패");
        return;
      }
      setShowGen(false);
      load();
    } finally {
      setGenerating(false);
    }
  }

  async function removeCurrent() {
    if (!current) return;
    const card = current;
    setQueue((prev) => prev.slice(1));
    setFlipped(false);
    await wsFetch(`/api/review/cards/${card.id}`, { method: "DELETE" });
    setStats((s) => ({ total: Math.max(0, s.total - 1), due: Math.max(0, s.due - 1) }));
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col overflow-y-auto px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-50">
            <Brain className="h-5 w-5 text-[var(--mode-accent)]" />
            복습 스케줄러
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            오늘 복습할 카드 <span className="font-semibold text-blue-600 dark:text-blue-300">{stats.due}</span>개
            · 전체 {stats.total}개
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-500/50 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-200"
          >
            <Plus className="h-4 w-4" />카드 추가
          </button>
          <button
            type="button"
            onClick={openGenerate}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30"
          >
            <Sparkles className="h-4 w-4" />서재에서 생성
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {/* 카드 수동 추가 */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-800/40">
              <input
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="앞면 (질문)"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
              />
              <textarea
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="뒷면 (답)"
                rows={2}
                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={addCard}
                disabled={saving || !front.trim() || !back.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "저장 중..." : "추가"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 서재에서 생성 */}
      <AnimatePresence>
        {showGen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="space-y-3 rounded-2xl border border-blue-300 bg-blue-50 p-4 dark:border-blue-500/30 dark:bg-blue-950/20">
              {libraryItems.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  먼저 서재에 자료를 올리면 그 내용으로 복습 카드를 자동 생성할 수 있어요.
                </p>
              ) : (
                <>
                  <select
                    value={genItemId}
                    onChange={(e) => setGenItemId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                  >
                    {libraryItems.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.title}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500 dark:text-slate-400">개수</label>
                    <input
                      type="number"
                      min={3}
                      max={30}
                      value={genCount}
                      onChange={(e) => setGenCount(Number(e.target.value))}
                      className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={generate}
                      disabled={generating}
                      className="ml-auto flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {generating ? "생성 중..." : "생성"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 학습 세션 */}
      <div className="mt-8 flex flex-1 flex-col items-center justify-center">
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-500" />
        ) : current ? (
          <div className="w-full">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
              <span>남은 카드 {queue.length}개</span>
              <span>이번 세션 {reviewed}개 복습</span>
            </div>
            <div
              onClick={() => !flipped && setFlipped(true)}
              className={`flex min-h-[14rem] cursor-pointer flex-col items-center justify-center rounded-3xl border p-8 text-center transition-colors ${
                flipped
                  ? "border-blue-500/40 bg-white dark:bg-slate-800/60"
                  : "border-slate-200 bg-white hover:border-blue-500/40 dark:border-slate-700/60 dark:bg-slate-800/40"
              }`}
            >
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 whitespace-pre-wrap">
                {current.front}
              </p>
              {flipped && (
                <>
                  <div className="my-4 h-px w-16 bg-slate-200 dark:bg-slate-700" />
                  <p className="text-base text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                    {current.back}
                  </p>
                </>
              )}
              {!flipped && (
                <p className="mt-4 text-xs text-slate-400 dark:text-slate-600">눌러서 정답 확인</p>
              )}
            </div>

            {flipped ? (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g.grade}
                    type="button"
                    onClick={() => grade(g.grade)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition-colors ${g.cls}`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setFlipped(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  <RotateCcw className="h-4 w-4" />정답 확인
                </button>
                <button
                  type="button"
                  onClick={removeCurrent}
                  title="이 카드 삭제"
                  className="rounded-xl border border-slate-300 px-3 py-2.5 text-slate-400 hover:text-red-500 dark:border-slate-700/60 dark:text-slate-500 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
              <Check className="h-7 w-7 text-white" />
            </div>
            <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {stats.total === 0
                ? "아직 복습 카드가 없어요. 직접 추가하거나 서재 자료로 자동 생성해 보세요."
                : "오늘 복습할 카드를 모두 끝냈어요! 🎉"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
