"use client";

import { ArrowRight } from "lucide-react";
import type { View } from "@/components/Sidebar";
import ModeSwitch from "@/components/ModeSwitch";
import { toolsForMode, type AppMode } from "@/lib/tools";

const GREETING: Record<AppMode, { eyebrow: string; title: string; subtitle: string }> = {
  office: {
    eyebrow: "직장인을 위한 zeff",
    title: "오늘은 뭐부터 처리해볼까요?",
    subtitle: "필요한 것만 골라서, 빠르게 끝내요.",
  },
  student: {
    eyebrow: "학생을 위한 zeff",
    title: "오늘은 뭐부터 시작해볼까요?",
    subtitle: "복습도 과제도, 부담 없이 시작해요.",
  },
};

export default function Dashboard({
  onNavigate,
  appMode,
  onModeChange,
}: {
  onNavigate: (v: View) => void;
  appMode: AppMode;
  onModeChange: (m: AppMode) => void;
}) {
  const tools = toolsForMode(appMode).filter((t) => t.appMode !== "common");
  const g = GREETING[appMode];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="max-w-xs sm:hidden">
          <ModeSwitch mode={appMode} onChange={onModeChange} />
        </div>
        <span className="ml-auto text-xs font-medium text-slate-500">{g.eyebrow}</span>
      </div>

      <div className="mt-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">{g.title}</h1>
        <p className="mt-2 text-sm text-slate-400">{g.subtitle}</p>
      </div>

      <button
        type="button"
        onClick={() => onNavigate("chat")}
        className="mt-8 flex w-full items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-800/40 px-5 py-4 text-left text-sm text-slate-400 shadow-xl shadow-black/30 backdrop-blur-md transition-colors hover:border-[var(--mode-accent)]/50"
      >
        무엇이든 물어보세요
        <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />
      </button>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onNavigate(tool.id)}
              className="flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-800/40 px-4 py-2 text-sm text-slate-300 backdrop-blur-md transition-colors hover:border-[var(--mode-accent)]/50 hover:text-slate-100"
            >
              <Icon className="h-4 w-4 text-[var(--mode-accent)]" />
              {tool.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
