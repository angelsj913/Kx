"use client";

import { useState } from "react";
import { Plus, Trash2, CalendarDays, Users, ClipboardList } from "lucide-react";
import { useAutosave } from "@/lib/useAutosave";
import SaveIndicator from "./SaveIndicator";
import type { MeetingMinutes } from "@/lib/structured";

export default function MeetingMinutesView({
  id,
  initial,
}: {
  id: string;
  initial: MeetingMinutes;
}) {
  const [data, setData] = useState(initial);
  const status = useAutosave(id, data);

  function updateItem(i: number, patch: Partial<MeetingMinutes["actionItems"][number]>) {
    setData((d) => ({
      ...d,
      actionItems: d.actionItems.map((item, idx) => (idx === i ? { ...item, ...patch } : item)),
    }));
  }

  function addItem() {
    setData((d) => ({
      ...d,
      actionItems: [...d.actionItems, { task: "", assignee: "", dueDate: "" }],
    }));
  }

  function removeItem(i: number) {
    setData((d) => ({ ...d, actionItems: d.actionItems.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-700/50 bg-slate-800/40 shadow-2xl shadow-black/40 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <ClipboardList className="h-4 w-4 text-[var(--mode-accent)]" />
          회의록
        </h2>
        <SaveIndicator status={status} />
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
        {/* 메타데이터 그리드 */}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <CalendarDays className="h-3.5 w-3.5" /> 날짜
            </span>
            <input
              type="text"
              value={data.date}
              onChange={(e) => setData((d) => ({ ...d, date: e.target.value }))}
              placeholder="예) 2026-07-09"
              className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Users className="h-3.5 w-3.5" /> 참석자
            </span>
            <input
              type="text"
              value={data.attendees.join(", ")}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  attendees: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
              placeholder="쉼표로 구분 (예: 김민준, 이서연)"
              className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">안건</span>
          <textarea
            value={data.agenda}
            onChange={(e) => setData((d) => ({ ...d, agenda: e.target.value }))}
            rows={2}
            className="w-full resize-y rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
          />
        </label>

        {/* 액션 아이템 위젯 */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">액션 아이템</span>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 rounded-lg border border-slate-700/60 px-2 py-1 text-xs font-medium text-[var(--mode-accent)] transition-colors hover:bg-slate-700/40"
            >
              <Plus className="h-3.5 w-3.5" /> 항목 추가
            </button>
          </div>

          {data.actionItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-700/60 py-6 text-center text-xs text-slate-500">
              아직 액션 아이템이 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {data.actionItems.map((item, i) => (
                <div
                  key={i}
                  className="grid gap-2 rounded-xl border border-slate-700/50 bg-slate-900/50 p-3 sm:grid-cols-[1fr_9rem_9rem_auto] sm:items-center"
                >
                  <input
                    type="text"
                    value={item.task}
                    onChange={(e) => updateItem(i, { task: e.target.value })}
                    placeholder="할 일"
                    className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
                  />
                  <input
                    type="text"
                    value={item.assignee}
                    onChange={(e) => updateItem(i, { assignee: e.target.value })}
                    placeholder="담당자"
                    className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
                  />
                  <input
                    type="date"
                    value={item.dueDate}
                    onChange={(e) => updateItem(i, { dueDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70 [color-scheme:dark]"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    aria-label="항목 삭제"
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
