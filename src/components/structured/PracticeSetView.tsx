"use client";

import { useState } from "react";
import { Plus, Trash2, Shuffle } from "lucide-react";
import { useAutosave } from "@/lib/useAutosave";
import SaveIndicator from "./SaveIndicator";
import type { PracticeSet } from "@/lib/structured";

export default function PracticeSetView({
  id,
  initial,
}: {
  id: string;
  initial: PracticeSet;
}) {
  const [data, setData] = useState(initial);
  const status = useAutosave(id, data);

  function updateProblem(i: number, patch: Partial<PracticeSet["problems"][number]>) {
    setData((d) => ({
      ...d,
      problems: d.problems.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    }));
  }

  function updateChoice(i: number, ci: number, value: string) {
    setData((d) => ({
      ...d,
      problems: d.problems.map((p, idx) =>
        idx === i ? { ...p, choices: p.choices.map((c, cidx) => (cidx === ci ? value : c)) } : p
      ),
    }));
  }

  function addChoice(i: number) {
    setData((d) => ({
      ...d,
      problems: d.problems.map((p, idx) => (idx === i ? { ...p, choices: [...p.choices, ""] } : p)),
    }));
  }

  function removeChoice(i: number, ci: number) {
    setData((d) => ({
      ...d,
      problems: d.problems.map((p, idx) =>
        idx === i ? { ...p, choices: p.choices.filter((_, cidx) => cidx !== ci) } : p
      ),
    }));
  }

  function addProblem() {
    setData((d) => ({
      ...d,
      problems: [...d.problems, { question: "", choices: ["", ""], answer: "", explanation: "" }],
    }));
  }

  function removeProblem(i: number) {
    setData((d) => ({ ...d, problems: d.problems.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white shadow-sm dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-black/40 dark:backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Shuffle className="h-4 w-4 text-[var(--mode-accent)]" />
          유사문제
        </h2>
        <SaveIndicator status={status} />
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">과목</span>
          <input
            type="text"
            value={data.subject}
            onChange={(e) => setData((d) => ({ ...d, subject: e.target.value }))}
            className="w-full max-w-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
          />
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">문제 목록</span>
            <button
              type="button"
              onClick={addProblem}
              className="flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs font-medium text-[var(--mode-accent)] transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/40"
            >
              <Plus className="h-3.5 w-3.5" /> 문제 추가
            </button>
          </div>

          {data.problems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 py-6 text-center text-xs text-slate-500">
              아직 생성된 문제가 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {data.problems.map((p, i) => (
                <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3.5">
                  <div className="flex items-start gap-2">
                    <span className="mt-2.5 shrink-0 text-xs font-semibold text-slate-500">
                      {i + 1}.
                    </span>
                    <textarea
                      value={p.question}
                      onChange={(e) => updateProblem(i, { question: e.target.value })}
                      rows={2}
                      placeholder="문제 내용"
                      className="w-full flex-1 resize-y rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
                    />
                    <button
                      type="button"
                      onClick={() => removeProblem(i)}
                      aria-label="문제 삭제"
                      className="mt-1.5 shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:text-red-500 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-2 space-y-1.5 pl-6">
                    {p.choices.map((c, ci) => (
                      <div key={ci} className="flex items-center gap-2">
                        <span className="w-4 shrink-0 text-xs text-slate-500">{ci + 1}</span>
                        <input
                          type="text"
                          value={c}
                          onChange={(e) => updateChoice(i, ci, e.target.value)}
                          placeholder="보기"
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
                        />
                        <button
                          type="button"
                          onClick={() => removeChoice(i, ci)}
                          aria-label="보기 삭제"
                          className="shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:text-red-500 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addChoice(i)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[var(--mode-accent)] transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/40"
                    >
                      <Plus className="h-3 w-3" /> 보기 추가
                    </button>
                  </div>

                  <div className="mt-2 grid gap-2 pl-6 sm:grid-cols-[8rem_1fr]">
                    <input
                      type="text"
                      value={p.answer}
                      onChange={(e) => updateProblem(i, { answer: e.target.value })}
                      placeholder="정답"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
                    />
                    <input
                      type="text"
                      value={p.explanation}
                      onChange={(e) => updateProblem(i, { explanation: e.target.value })}
                      placeholder="해설"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
