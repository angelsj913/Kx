"use client";

import { useState } from "react";
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

      {/* 메인 영역 */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
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
      </div>
    </div>
  );
}
