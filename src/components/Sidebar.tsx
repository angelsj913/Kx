"use client";

import {
  LayoutDashboard,
  Briefcase,
  MessagesSquare,
  History,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type View = "dashboard" | "business" | "interview" | "history";

const NAV: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "대시보드 홈", icon: LayoutDashboard },
  { id: "business", label: "비즈니스 말투 변환", icon: Briefcase },
  { id: "interview", label: "자소서 면접 질문", icon: MessagesSquare },
  { id: "history", label: "마이 히스토리", icon: History },
];

export default function Sidebar({
  view,
  onNavigate,
}: {
  view: View;
  onNavigate: (v: View) => void;
}) {
  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-slate-800/60 bg-slate-900/40 backdrop-blur-md sm:w-60">
      <div className="flex items-center gap-2.5 border-b border-slate-800/60 px-3 py-4 sm:px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-bold tracking-tight text-slate-50">AI 툴킷</p>
          <p className="text-[11px] text-slate-500">Premium AI Desktop</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2 sm:p-3">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              title={label}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                active
                  ? "bg-gradient-to-r from-violet-600/90 to-indigo-600/90 text-white shadow-lg shadow-violet-900/30"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="hidden border-t border-slate-800/60 p-4 sm:block">
        <p className="text-[11px] leading-relaxed text-slate-600">
          Powered by Google Gemini
          <br />
          API 키는 서버에서만 사용됩니다
        </p>
      </div>
    </aside>
  );
}
