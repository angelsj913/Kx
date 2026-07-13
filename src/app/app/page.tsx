"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import ChatWorkspace from "@/components/ChatWorkspace";
import LibraryView from "@/components/LibraryView";
import ReviewView from "@/components/ReviewView";
import RagView from "@/components/RagView";
import { useSessions } from "@/lib/sessions";

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
    <div className="flex h-screen w-full overflow-hidden bg-[var(--workspace-bg)] text-[var(--workspace-text)]">
      
      {/* 왼쪽 사이드바 (고정 폭) */}
      <div className="w-72 shrink-0 border-r border-[var(--workspace-border)] bg-[var(--workspace-surface)]">
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
      </div>

      {/* 오른쪽 메인 영역 (자동으로 남은 공간 채움) */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={view === "chat" ? (activeSessionId ?? "new") : view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-1 flex-col min-h-0"
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
      </div>
    </div>
  );
}
