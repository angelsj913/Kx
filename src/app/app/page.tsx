"use client";

import { useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import ChatWorkspace from "@/components/ChatWorkspace";
import LibraryView from "@/components/LibraryView";
import ReviewView from "@/components/ReviewView";
import RagView from "@/components/RagView";
import { useSessions } from "@/lib/sessions";

export const dynamic = "force-dynamic";

// 모드 개념이 사라져 고정 포인트 컬러로 통일 (기존 학생 모드 팔레트와 동일한 톤).
const ACCENT_VARS = {
  "--mode-bg": "#0F172A",
  "--mode-accent": "#8B5CF6",
  "--mode-accent-deep": "#6D28D9",
} as CSSProperties;

export default function AppWorkspace() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [view, setView] = useState<"chat" | "library" | "review" | "rag">("chat");
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
      className="relative flex h-screen overflow-hidden bg-[var(--mode-bg)] text-slate-100"
    >
      <div className="pointer-events-none absolute -top-40 left-1/3 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-[var(--mode-accent)]/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[24rem] w-[24rem] rounded-full bg-[var(--mode-accent-deep)]/10 blur-[120px]" />

      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        activeView={view}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onOpenLibrary={() => setView("library")}
        onOpenReview={() => setView("review")}
        onOpenRag={() => setView("rag")}
      />

      <main className="relative z-10 min-w-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={
              view === "library" || view === "review" || view === "rag"
                ? view
                : activeSessionId ?? "new"
            }
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full"
          >
            {view === "library" ? (
              <LibraryView onOpenBookChat={handleOpenBookChat} />
            ) : view === "review" ? (
              <ReviewView />
            ) : view === "rag" ? (
              <RagView />
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
