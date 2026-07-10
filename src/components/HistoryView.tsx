"use client";

import ReactMarkdown from "react-markdown";
import { Trash2, History as HistoryIcon, Sparkles, User } from "lucide-react";
import type { ChatHistoryItem } from "@/lib/chatHistory";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryView({
  items,
  loading,
  removeItem,
  clearAll,
}: {
  items: ChatHistoryItem[];
  loading: boolean;
  removeItem: (id: string) => void;
  clearAll: () => void;
}) {
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
          아직 나눈 대화가 없습니다.
          <br />
          zeff와 대화를 시작하면 여기에 자동으로 쌓여요.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">마이 히스토리 ({items.length})</h2>
        <button
          type="button"
          onClick={() => {
            if (confirm("모든 대화 기록을 삭제할까요?")) clearAll();
          }}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 transition-colors hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
          전체 삭제
        </button>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 shadow-xl shadow-black/30 backdrop-blur-md sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] text-slate-500">{formatDate(item.createdAt)}</span>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label="이 기록 삭제"
                className="shrink-0 rounded-lg p-1 text-slate-500 transition-colors hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-2.5 flex items-start gap-2.5">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <p className="text-sm text-slate-200">{item.message}</p>
            </div>
            <div className="mt-2.5 flex items-start gap-2.5 border-t border-slate-700/40 pt-2.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
              <div className="prose-ai line-clamp-3 min-w-0 text-sm text-slate-400">
                <ReactMarkdown>{item.reply}</ReactMarkdown>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
