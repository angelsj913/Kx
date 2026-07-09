"use client";

import { History, ArrowRight } from "lucide-react";
import type { View } from "@/components/Sidebar";
import ModeSwitch from "@/components/ModeSwitch";
import { toolsForMode, type AppMode } from "@/lib/tools";

export default function Dashboard({
  onNavigate,
  historyCount,
  appMode,
  onModeChange,
}: {
  onNavigate: (v: View) => void;
  historyCount: number;
  appMode: AppMode;
  onModeChange: (m: AppMode) => void;
}) {
  const tools = toolsForMode(appMode);
  const isStudent = appMode === "student";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-[var(--mode-accent)]/20 to-[var(--mode-accent-deep)]/10 p-6 shadow-2xl shadow-black/40 backdrop-blur-md transition-colors duration-500 ease-in-out sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
          {isStudent ? "학생을 위한 AI 툴킷" : "직장인을 위한 AI 툴킷"}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
          {isStudent
            ? "강의 요약, 수업 정리, 발표문 작성까지. 공부에 필요한 도구를 한곳에 모았습니다."
            : "문서 작성, PPT·엑셀 초안까지. 업무에 필요한 도구를 한곳에 모았습니다."}
        </p>

        {/* 모바일용 모드 전환 (사이드바에서는 넓은 화면에만 보임) */}
        <div className="mt-5 max-w-xs sm:hidden">
          <ModeSwitch mode={appMode} onChange={onModeChange} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onNavigate(tool.id)}
              className="group flex flex-col rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 text-left shadow-xl shadow-black/30 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-[var(--mode-accent)]/50"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--mode-accent)] to-[var(--mode-accent-deep)] shadow-lg shadow-black/40 transition-colors duration-500 ease-in-out">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">
                {tool.title}
              </h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-400">
                {tool.description}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--mode-accent)] transition-transform duration-300 group-hover:translate-x-1">
                시작하기 <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onNavigate("history")}
        className="mt-4 flex w-full items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 text-left shadow-xl shadow-black/30 backdrop-blur-md transition-all duration-300 hover:border-[var(--mode-accent)]/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/60">
            <History className="h-5 w-5 text-[var(--mode-accent)]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">마이 히스토리</h3>
            <p className="text-sm text-slate-400">
              저장된 작업 {historyCount.toLocaleString()}건 · 언제든 다시 열어보세요
            </p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-slate-500" />
      </button>
    </div>
  );
}
