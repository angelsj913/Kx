"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatWorkspace from "@/components/ChatWorkspace";
import LibraryView from "@/components/LibraryView";
import ReviewView from "@/components/ReviewView";
import RagView from "@/components/RagView";
import { useSessions } from "@/lib/sessions";
import { workspaceAccentCssVars } from "@/lib/theme";

export default function AppWorkspace() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [view, setView] = useState<"chat" | "library" | "review" | "rag">("chat");
  const { sessions, refetch, removeSession } = useSessions();

  return (
    <div
      style={workspaceAccentCssVars()}
      className="flex h-screen w-full overflow-hidden bg-[var(--workspace-bg)] font-[family-name:var(--font-noto-kr)] text-[var(--workspace-text)]"
    >
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        activeView={view}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setView("chat");
        }}
        onNewChat={() => {
          setActiveSessionId(null);
          setView("chat");
        }}
        onDeleteSession={async (id) => {
          await removeSession(id);
          if (id === activeSessionId) setActiveSessionId(null);
        }}
        onOpenLibrary={() => setView("library")}
        onOpenReview={() => setView("review")}
        onOpenRag={() => setView("rag")}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {view === "chat" && (
          <ChatWorkspace
            sessionId={activeSessionId}
            onSessionCreated={(id) => {
              setActiveSessionId(id);
              refetch();
            }}
            onTurnSaved={refetch}
          />
        )}
        {view === "library" && (
          <LibraryView
            onOpenBookChat={(sessionId) => {
              setActiveSessionId(sessionId);
              refetch();
              setView("chat");
            }}
          />
        )}
        {view === "review" && <ReviewView />}
        {view === "rag" && <RagView />}
      </div>
    </div>
  );
}
