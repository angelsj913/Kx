"use client";

import { useState } from "react";
import Sidebar, { type View } from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import GeneratorView from "@/components/GeneratorView";
import HistoryView from "@/components/HistoryView";
import { useHistory } from "@/lib/history";
import { useAppMode, setAppMode } from "@/lib/appMode";
import { getTool, type AppMode } from "@/lib/tools";

export const dynamic = "force-dynamic";

export default function AppWorkspace() {
  const [view, setView] = useState<View>("dashboard");
  const history = useHistory();
  const appMode = useAppMode();

  function handleModeChange(mode: AppMode) {
    setAppMode(mode);
    // 현재 보고 있던 도구가 새 모드에 없으면 대시보드로 돌아간다
    const currentTool = getTool(view);
    if (currentTool && currentTool.appMode !== mode) {
      setView("dashboard");
    }
  }

  const activeTool = getTool(view);

  return (
    <div className="relative flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* ambient background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/3 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[24rem] w-[24rem] rounded-full bg-indigo-600/10 blur-[120px]" />

      <Sidebar
        view={view}
        onNavigate={setView}
        appMode={appMode}
        onModeChange={handleModeChange}
      />

      <main className="relative z-10 min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {view === "dashboard" && (
          <Dashboard
            onNavigate={setView}
            historyCount={history.length}
            appMode={appMode}
            onModeChange={handleModeChange}
          />
        )}
        {view === "history" && <HistoryView items={history} />}
        {activeTool && <GeneratorView key={activeTool.id} tool={activeTool} />}
      </main>
    </div>
  );
}
