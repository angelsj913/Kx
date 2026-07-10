"use client";

import { useCallback, useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatWorkspace from "@/components/ChatWorkspace";
import { useSessions } from "@/lib/sessions";
import { useSettings } from "@/lib/useSettings";

export const dynamic = "force-dynamic";

export default function AppWorkspace() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const { sessions, loading: sessionsLoading, refetch, removeSession } = useSessions();
  const { plan, enabledQuickTools } = useSettings();

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
  }, []);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  const handleDeleteSession = useCallback(
    (id: string) => {
      if (activeSessionId === id) setActiveSessionId(null);
      removeSession(id);
    },
    [activeSessionId, removeSession],
  );

  const handleSessionCreated = useCallback(
    (id: string) => {
      setActiveSessionId(id);
      refetch();
    },
    [refetch],
  );

  return (
    <div className="relative flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute -top-40 left-1/3 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[24rem] w-[24rem] rounded-full bg-indigo-500/10 blur-[120px]" />

      <Sidebar
        sessions={sessions}
        sessionsLoading={sessionsLoading}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        plan={plan}
      />

      <main className="relative z-10 min-w-0 flex-1 overflow-hidden">
        <ChatWorkspace
          sessionId={activeSessionId}
          enabledQuickTools={enabledQuickTools}
          onSessionCreated={handleSessionCreated}
          onTurnSaved={refetch}
        />
      </main>
    </div>
  );
}
