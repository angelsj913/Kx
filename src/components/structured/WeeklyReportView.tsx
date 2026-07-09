"use client";

import { useState } from "react";
import { Plus, Trash2, BarChart3 } from "lucide-react";
import { useAutosave } from "@/lib/useAutosave";
import SaveIndicator from "./SaveIndicator";
import type { WeeklyReport, WeeklyReportItem } from "@/lib/structured";

function Column({
  title,
  items,
  onChange,
}: {
  title: string;
  items: WeeklyReportItem[];
  onChange: (items: WeeklyReportItem[]) => void;
}) {
  function update(i: number, patch: Partial<WeeklyReportItem>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function add() {
    onChange([...items, { item: "", progress: 0 }]);
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 rounded-lg border border-slate-700/60 px-2 py-1 text-xs font-medium text-[var(--mode-accent)] transition-colors hover:bg-slate-700/40"
        >
          <Plus className="h-3.5 w-3.5" /> 추가
        </button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-700/60 py-6 text-center text-xs text-slate-500">
          항목이 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="rounded-lg border border-slate-700/50 bg-slate-950/40 p-3">
              <div className="flex items-start gap-2">
                <input
                  type="text"
                  value={it.item}
                  onChange={(e) => update(i, { item: e.target.value })}
                  placeholder="업무 항목"
                  className="w-full flex-1 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
                />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="항목 삭제"
                  className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2.5 flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={it.progress}
                  onChange={(e) => update(i, { progress: Number(e.target.value) })}
                  className="h-1.5 w-full flex-1 cursor-pointer appearance-none rounded-full bg-slate-700/60 accent-[var(--mode-accent)]"
                />
                <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-[var(--mode-accent)]">
                  {it.progress}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
                <div
                  className="h-full rounded-full bg-[var(--mode-accent)] transition-all duration-300 ease-out"
                  style={{ width: `${it.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WeeklyReportView({
  id,
  initial,
}: {
  id: string;
  initial: WeeklyReport;
}) {
  const [data, setData] = useState(initial);
  const status = useAutosave(id, data);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-700/50 bg-slate-800/40 shadow-2xl shadow-black/40 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <BarChart3 className="h-4 w-4 text-[var(--mode-accent)]" />
          주간 업무 보고
        </h2>
        <SaveIndicator status={status} />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 sm:grid-cols-2 sm:p-5">
        <Column
          title="이번 주 진행 사항"
          items={data.thisWeek}
          onChange={(items) => setData((d) => ({ ...d, thisWeek: items }))}
        />
        <Column
          title="다음 주 계획"
          items={data.nextWeek}
          onChange={(items) => setData((d) => ({ ...d, nextWeek: items }))}
        />
      </div>
    </div>
  );
}
