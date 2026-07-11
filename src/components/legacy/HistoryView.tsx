"use client";

import { useState } from "react";
import { Trash2, History as HistoryIcon, FileText } from "lucide-react";
import ResultPanel from "@/components/ResultPanel";
import FileResultPanel from "@/components/FileResultPanel";
import StructuredResultView from "@/components/structured/StructuredResultView";
import type { HistoryItem } from "@/lib/legacy/history";
import { getTool } from "@/lib/tools";
import type { Deck, Workbook } from "@/lib/fileTypes";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeParse<T>(raw: string): T | undefined {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export default function HistoryView({
  items,
  loading,
  removeItem,
  clearAll,
}: {
  items: HistoryItem[];
  loading: boolean;
  removeItem: (id: string) => void;
  clearAll: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = items.find((i) => i.id === selectedId) ?? items[0] ?? null;

  if (loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-800/40 py-20 text-center shadow-2xl shadow-black/40 backdrop-blur-md">
        <p className="text-sm text-slate-500">히스토리를 불러오는 중...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-800/40 py-20 text-center shadow-2xl shadow-black/40 backdrop-blur-md">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-900/60">
          <HistoryIcon className="h-7 w-7 text-slate-600" />
        </div>
        <p className="mt-4 text-sm text-slate-500">
          아직 저장된 히스토리가 없습니다.
          <br />
          AI 기능을 사용하면 결과가 자동으로 여기에 보관됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      {/* 목록 */}
      <section className="flex flex-col rounded-2xl border border-slate-700/50 bg-slate-800/40 shadow-2xl shadow-black/40 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-300">
            마이 히스토리 ({items.length})
          </h2>
          <button
            type="button"
            onClick={() => {
              if (confirm("모든 히스토리를 삭제할까요?")) {
                clearAll();
                setSelectedId(null);
              }
            }}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 transition-colors hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            전체 삭제
          </button>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {items.map((item) => {
            const Icon = getTool(item.toolId)?.icon ?? FileText;
            const active = selected?.id === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`group flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all duration-200 ${
                    active
                      ? "bg-[var(--mode-accent)]/20 ring-1 ring-[var(--mode-accent)]/40"
                      : "hover:bg-slate-800/60"
                  }`}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-900/60">
                    <Icon className="h-4 w-4 text-[var(--mode-accent)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[var(--mode-accent)]">
                        {item.toolLabel}
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-500">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-slate-300">
                      {item.prompt}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 상세 */}
      <div className="flex min-h-[400px] flex-col gap-3">
        {selected && (
          <>
            <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 backdrop-blur-md">
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--mode-accent)]">
                  {selected.toolLabel} · {formatDate(selected.createdAt)}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-300">
                  <span className="text-slate-500">입력: </span>
                  {selected.prompt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  removeItem(selected.id);
                  const next = items.filter((i) => i.id !== selected.id);
                  setSelectedId(next[0]?.id ?? null);
                }}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-700/60 px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-red-500/40 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
                삭제
              </button>
            </div>
            <div className="min-h-0 flex-1">
              {selected.outputType === "pptx" ? (
                <FileResultPanel
                  outputType="pptx"
                  deck={safeParse<Deck>(selected.result)}
                  file={
                    selected.fileUrl
                      ? {
                          url: selected.fileUrl,
                          filename: selected.fileName ?? "presentation.pptx",
                          mimeType:
                            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                        }
                      : undefined
                  }
                />
              ) : selected.outputType === "xlsx" ? (
                <FileResultPanel
                  outputType="xlsx"
                  workbook={safeParse<Workbook>(selected.result)}
                  file={
                    selected.fileUrl
                      ? {
                          url: selected.fileUrl,
                          filename: selected.fileName ?? "workbook.xlsx",
                          mimeType:
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        }
                      : undefined
                  }
                />
              ) : selected.outputType === "structured" &&
                getTool(selected.toolId)?.structuredKind ? (
                <StructuredResultView
                  key={selected.id}
                  {...({
                    id: selected.id,
                    kind: getTool(selected.toolId)!.structuredKind,
                    data: safeParse(selected.result) ?? {},
                  } as React.ComponentProps<typeof StructuredResultView>)}
                />
              ) : (
                <ResultPanel
                  content={selected.result}
                  fileBaseName={getTool(selected.toolId)?.fileBaseName ?? "ai-result"}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
