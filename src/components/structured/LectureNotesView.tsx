"use client";

import { useState } from "react";
import { Plus, Trash2, NotebookText, Lightbulb } from "lucide-react";
import { useAutosave } from "@/lib/useAutosave";
import SaveIndicator from "./SaveIndicator";
import type { LectureNotes } from "@/lib/structured";

export default function LectureNotesView({
  id,
  initial,
}: {
  id: string;
  initial: LectureNotes;
}) {
  const [data, setData] = useState<LectureNotes>({
    ...initial,
    summaryLines: [
      initial.summaryLines[0] ?? "",
      initial.summaryLines[1] ?? "",
      initial.summaryLines[2] ?? "",
    ],
  });
  const status = useAutosave(id, data);

  function updateConcept(i: number, patch: Partial<LectureNotes["concepts"][number]>) {
    setData((d) => ({
      ...d,
      concepts: d.concepts.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    }));
  }
  function addConcept() {
    setData((d) => ({ ...d, concepts: [...d.concepts, { cue: "", detail: "" }] }));
  }
  function removeConcept(i: number) {
    setData((d) => ({ ...d, concepts: d.concepts.filter((_, idx) => idx !== i) }));
  }
  function updateSummaryLine(i: number, value: string) {
    setData((d) => ({
      ...d,
      summaryLines: d.summaryLines.map((l, idx) => (idx === i ? value : l)),
    }));
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-700/50 bg-slate-800/40 shadow-2xl shadow-black/40 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <NotebookText className="h-4 w-4 text-[var(--mode-accent)]" />
          강의 요약 노트
        </h2>
        <SaveIndicator status={status} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        {/* 능동 회상 2단 레이아웃 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">핵심 개념 · 큐</h3>
              <button
                type="button"
                onClick={addConcept}
                className="flex items-center gap-1 rounded-lg border border-slate-700/60 px-2 py-1 text-xs font-medium text-[var(--mode-accent)] transition-colors hover:bg-slate-700/40"
              >
                <Plus className="h-3.5 w-3.5" /> 추가
              </button>
            </div>
            <div className="space-y-2">
              {data.concepts.map((c, i) => (
                <div key={i} className="rounded-lg border border-slate-700/50 bg-slate-950/40 p-3">
                  <div className="flex items-start gap-2">
                    <input
                      type="text"
                      value={c.cue}
                      onChange={(e) => updateConcept(i, { cue: e.target.value })}
                      placeholder="키워드/질문"
                      className="w-full flex-1 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-1.5 text-sm font-semibold text-[var(--mode-accent)] outline-none transition-colors focus:border-[var(--mode-accent)]/70"
                    />
                    <button
                      type="button"
                      onClick={() => removeConcept(i)}
                      aria-label="개념 삭제"
                      className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <textarea
                    value={c.detail}
                    onChange={(e) => updateConcept(i, { detail: e.target.value })}
                    placeholder="상세 설명"
                    rows={2}
                    className="mt-2 w-full resize-y rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-300 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
                  />
                </div>
              ))}
              {data.concepts.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-700/60 py-6 text-center text-xs text-slate-500">
                  아직 개념이 없습니다.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-200">강의 필기</h3>
            <textarea
              value={data.transcript}
              onChange={(e) => setData((d) => ({ ...d, transcript: e.target.value }))}
              rows={14}
              className="w-full flex-1 resize-y rounded-lg border border-slate-700/60 bg-slate-950/40 p-3 text-sm leading-relaxed text-slate-300 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
            />
          </div>
        </div>

        {/* 3줄 요약 하이라이트 박스 */}
        <div className="mt-4 rounded-xl border border-[var(--mode-accent)]/40 bg-[var(--mode-accent)]/10 p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--mode-accent)]">
            <Lightbulb className="h-4 w-4" /> 3줄 요약
          </h3>
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--mode-accent)]/20 text-[10px] font-bold text-[var(--mode-accent)]">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={data.summaryLines[i] ?? ""}
                  onChange={(e) => updateSummaryLine(i, e.target.value)}
                  placeholder={`요약 ${i + 1}`}
                  className="w-full rounded-lg border border-slate-700/50 bg-slate-950/40 px-3 py-1.5 text-sm text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
