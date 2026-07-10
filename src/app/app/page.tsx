"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar, { type View } from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import GeneratorView from "@/components/GeneratorView";
import AiChat from "@/components/AiChat";
import HistoryView from "@/components/HistoryView";
import { useChatHistory } from "@/lib/chatHistory";
import { useAppMode, setAppMode } from "@/lib/appMode";
import { getTool, type AppMode } from "@/lib/tools";
import { themeCssVars } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default function AppWorkspace() {
  const [view, setView] = useState<View>("dashboard");
  const { items: history, loading, prepend, removeItem, clearAll, refetch } = useChatHistory();
  const appMode = useAppMode();

  function handleNavigate(v: View) {
    setView(v);
    if (v === "history") refetch();
  }

  function handleModeChange(mode: AppMode) {
    setAppMode(mode);
    // 현재 보고 있던 도구가 새 모드 전용이라 안 맞으면 대시보드로 (공통 도구는 유지)
    const currentTool = getTool(view);
    if (
      currentTool &&
      currentTool.appMode !== "common" &&
      currentTool.appMode !== mode
    ) {
      setView("dashboard");
    }
  }

  const activeTool = getTool(view);

  return (
    <div
      style={themeCssVars(appMode)}
      className="relative flex h-screen overflow-hidden bg-[var(--mode-bg)] text-slate-100 transition-colors duration-500 ease-in-out"
    >
      {/* ambient background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/3 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-[var(--mode-accent)]/20 blur-[120px] transition-colors duration-500 ease-in-out" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[24rem] w-[24rem] rounded-full bg-[var(--mode-accent-deep)]/10 blur-[120px] transition-colors duration-500 ease-in-out" />

      <Sidebar
        view={view}
        onNavigate={handleNavigate}
        appMode={appMode}
        onModeChange={handleModeChange}
      />

      <main className="relative z-10 min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${appMode}-${view}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {view === "dashboard" && (
              <Dashboard onNavigate={handleNavigate} appMode={appMode} onModeChange={handleModeChange} />
            )}
            {view === "history" && (
              <HistoryView
                items={history}
                loading={loading}
                removeItem={removeItem}
                clearAll={clearAll}
              />
            )}
            {activeTool &&
              (activeTool.inputType === "chat" ? (
                <AiChat items={history} prepend={prepend} />
              ) : (
                <GeneratorView tool={activeTool} />
              ))}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
