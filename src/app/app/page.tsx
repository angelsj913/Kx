"use client";

import { useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import ChatWorkspace from "@/components/ChatWorkspace";
import LibraryView from "@/components/LibraryView";
import { useSessions } from "@/lib/sessions";

export const dynamic = "force-dynamic";

// 홈페이지와 동일한 파랑 강조색으로 통일. 결과/구조화 패널이 이 변수를 소비한다.
const ACCENT_VARS = {
  "--mode-accent": "#2563EB",
  "--mode-accent-deep": "#4F46E5",
} as CSSProperties;

export default function AppWorkspace() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [view, setView] = useState<"chat" | "library">("chat");
  const { sessions, refetch, removeSession } = useSessions();

  function handleNewChat() {
    setActiveSessionId(null);
    setView("chat");
  }

  function handleSelectSession(id: string) {
    setActiveSessionId(id);
    setView("chat");
  }

  function handleSessionCreated(id: string) {
    setActiveSessionId(id);
    refetch();
  }

  async function handleDeleteSession(id: string) {
    await removeSession(id);
    if (id === activeSessionId) setActiveSessionId(null);
  }

  function handleOpenBookChat(sessionId: string) {
    setActiveSessionId(sessionId);
    refetch();
    setView("chat");
  }

  return (
    <div
      style={ACCENT_VARS}
      className="relative flex h-screen overflow-hidden bg-slate-50 font-[family-name:var(--font-noto-kr)] text-slate-900 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] dark:bg-slate-950 dark:text-slate-100"
    >
      <div className="pointer-events-none absolute -top-40 left-1/3 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-500/20" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[24rem] w-[24rem] rounded-full bg-indigo-500/5 blur-[120px] dark:bg-indigo-500/10" />

      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        activeView={view}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onOpenLibrary={() => setView("library")}
      />

      <main className="relative z-10 min-w-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={view === "library" ? "library" : activeSessionId ?? "new"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full"
          >
            {view === "library" ? (
              <LibraryView onOpenBookChat={handleOpenBookChat} />
            ) : (
              <ChatWorkspace
                sessionId={activeSessionId}
                onSessionCreated={handleSessionCreated}
                onTurnSaved={refetch}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
