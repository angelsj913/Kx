"use client";

import { useState } from "react";
import { Plus, Trash2, ScanSearch, Gauge } from "lucide-react";
import { useAutosave } from "@/lib/useAutosave";
import SaveIndicator from "./SaveIndicator";
import type { ExamAnalysis } from "@/lib/structured";

export default function ExamAnalysisView({
  id,
  initial,
}: {
  id: string;
  initial: ExamAnalysis;
}) {
  const [data, setData] = useState(initial);
  const status = useAutosave(id, data);

  function updateQuestion(i: number, patch: Partial<ExamAnalysis["questions"][number]>) {
    setData((d) => ({
      ...d,
      questions: d.questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)),
    }));
  }

  function addQuestion() {
    setData((d) => ({
      ...d,
      questions: [...d.questions, { number: "", topic: "", difficulty: "", keyPoint: "" }],
    }));
  }

  function removeQuestion(i: number) {
    setData((d) => ({ ...d, questions: d.questions.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-700/50 bg-slate-800/40 shadow-2xl shadow-black/40 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <ScanSearch className="h-4 w-4 text-[var(--mode-accent)]" />
          시험지 분석
        </h2>
        <SaveIndicator status={status} />
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">시험 제목</span>
            <input
              type="text"
              value={data.examTitle}
              onChange={(e) => setData((d) => ({ ...d, examTitle: e.target.value }))}
              className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">과목</span>
            <input
              type="text"
              value={data.subject}
              onChange={(e) => setData((d) => ({ ...d, subject: e.target.value }))}
              className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Gauge className="h-3.5 w-3.5" /> 전체 난이도
            </span>
            <input
              type="text"
              value={data.overallDifficulty}
              onChange={(e) => setData((d) => ({ ...d, overallDifficulty: e.target.value }))}
              placeholder="예) 중상"
              className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">총평</span>
          <textarea
            value={data.summary}
            onChange={(e) => setData((d) => ({ ...d, summary: e.target.value }))}
            rows={3}
            className="w-full resize-y rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
          />
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">문항별 분석</span>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-1 rounded-lg border border-slate-700/60 px-2 py-1 text-xs font-medium text-[var(--mode-accent)] transition-colors hover:bg-slate-700/40"
            >
              <Plus className="h-3.5 w-3.5" /> 문항 추가
            </button>
          </div>

          {data.questions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-700/60 py-6 text-center text-xs text-slate-500">
              아직 분석된 문항이 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {data.questions.map((q, i) => (
                <div
                  key={i}
                  className="grid gap-2 rounded-xl border border-slate-700/50 bg-slate-900/50 p-3 sm:grid-cols-[4rem_1fr_6rem_1fr_auto] sm:items-center"
                >
                  <input
                    type="text"
                    value={q.number}
                    onChange={(e) => updateQuestion(i, { number: e.target.value })}
                    placeholder="번호"
                    className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
                  />
                  <input
                    type="text"
                    value={q.topic}
                    onChange={(e) => updateQuestion(i, { topic: e.target.value })}
                    placeholder="출제 단원/포인트"
                    className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
                  />
                  <input
                    type="text"
                    value={q.difficulty}
                    onChange={(e) => updateQuestion(i, { difficulty: e.target.value })}
                    placeholder="난이도"
                    className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
                  />
                  <input
                    type="text"
                    value={q.keyPoint}
                    onChange={(e) => updateQuestion(i, { keyPoint: e.target.value })}
                    placeholder="핵심 포인트"
                    className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
                  />
                  <button
                    type="button"
                    onClick={() => removeQuestion(i)}
                    aria-label="문항 삭제"
                    className="justify-self-end rounded-lg p-2 text-slate-500 transition-colors hover:text-red-400 sm:justify-self-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
