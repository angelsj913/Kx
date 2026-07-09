"use client";

import { LayoutDashboard, History, Sparkles, UserRound } from "lucide-react";
import ModeSwitch from "@/components/ModeSwitch";
import { toolsForMode, type AppMode } from "@/lib/tools";

/** "dashboard" · "history" 또는 도구 id */
export type View = string;

export default function Sidebar({
  view,
  onNavigate,
  appMode,
  onModeChange,
}: {
  view: View;
  onNavigate: (v: View) => void;
  appMode: AppMode;
  onModeChange: (m: AppMode) => void;
}) {
  const tools = toolsForMode(appMode);

  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-slate-800/60 bg-slate-900/40 backdrop-blur-md transition-colors duration-500 ease-in-out sm:w-60">
      <div className="flex items-center gap-2.5 border-b border-slate-800/60 px-3 py-4 sm:px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-bold tracking-tight text-slate-50">AI 툴킷</p>
          <p className="text-[11px] text-slate-500">Premium AI Desktop</p>
        </div>
      </div>

      {/* 학생 / 직장인 전환 */}
      <div className="hidden border-b border-slate-800/60 p-3 sm:block">
        <ModeSwitch mode={appMode} onChange={onModeChange} />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2 sm:p-3">
        <NavButton
          active={view === "dashboard"}
          label="대시보드 홈"
          icon={LayoutDashboard}
          onClick={() => onNavigate("dashboard")}
        />

        <p className="mt-3 mb-1 hidden px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600 sm:block">
          {appMode === "student" ? "학생 도구" : "직장인 도구"}
        </p>

        {tools.map((tool) => (
          <NavButton
            key={tool.id}
            active={view === tool.id}
            label={tool.label}
            icon={tool.icon}
            onClick={() => onNavigate(tool.id)}
          />
        ))}

        <div className="mt-3 space-y-1 border-t border-slate-800/60 pt-2">
          <NavButton
            active={view === "history"}
            label="마이 히스토리"
            icon={History}
            onClick={() => onNavigate("history")}
          />
          <NavButton
            active={view === "account"}
            label="내 계정"
            icon={UserRound}
            onClick={() => onNavigate("account")}
          />
        </div>
      </nav>

      <div className="hidden border-t border-slate-800/60 p-4 sm:block">
        <p className="text-[11px] leading-relaxed text-slate-600">
          Powered by Google Gemini
          <br />
          입력 내용은 안전하게 처리됩니다
        </p>
      </div>
    </aside>
  );
}

function NavButton({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
        active
          ? "bg-gradient-to-r from-[var(--mode-accent)]/90 to-[var(--mode-accent-deep)]/90 text-white shadow-lg shadow-black/30"
          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
