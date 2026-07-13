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
    <div className="flex h-screen overflow-hidden bg-[var(--workspace-bg)] text-[var(--workspace-text)]">
      {/* 사이드바 */}
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

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 min-w-0 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={view === "chat" ? (activeSessionId ?? "new") : view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
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
