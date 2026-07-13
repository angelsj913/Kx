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

  const handleNewChat = () => {
    setActiveSessionId(null);
    setView("chat");
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setView("chat");
  };

  const handleSessionCreated = (id: string) => {
    setActiveSessionId(id);
    refetch();
  };

  const handleDeleteSession = async (id: string) => {
    await removeSession(id);
    if (id === activeSessionId) setActiveSessionId(null);
  };

  const handleOpenBookChat = (sessionId: string) => {
    setActiveSessionId(sessionId);
    refetch();
    setView("chat");
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--workspace-bg)] text-[var(--workspace-text)]">
      
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

      <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={view === "chat" ? (activeSessionId ?? "new") : view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 min-h-0"
          >
            {view === "library" && <LibraryView onOpenBookChat={handleOpenBookChat} />}
            {view === "review" && <ReviewView />}
            {view === "rag" && <RagView />}
            {view === "chat" && (
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
