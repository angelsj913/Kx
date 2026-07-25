"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useSessions } from "@/lib/sessions";
import { workspaceAccentCssVars } from "@/lib/theme";
import { useT } from "@/lib/i18n";

const ChatWorkspace = dynamic(() => import("@/components/ChatWorkspace"), {
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-[var(--workspace-text-secondary)]">…</div>
  ),
});

export default function AppWorkspace() {
  const t = useT();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const { sessions, loading, refetch, removeSession, createSession, upsertSession } = useSessions();
  const selectedForLoad = useRef(false);

  const handleNewChat = useCallback(async () => {
    setMobileNav(false);
    try {
      const s = await createSession();
      setActiveSessionId(s.id);
    } catch {
      setActiveSessionId(null);
    }
  }, [createSession]);

  useEffect(() => {
    if (loading) {
      selectedForLoad.current = false;
      return;
    }
    if (selectedForLoad.current) return;
    selectedForLoad.current = true;
    setActiveSessionId(null);
  }, [loading, sessions]);

  const wasLoading = useRef(loading);
  useEffect(() => {
    if (!wasLoading.current && loading) {
      selectedForLoad.current = false;
      setActiveSessionId(null);
    }
    wasLoading.current = loading;
  }, [loading]);

  return (
    <div
      style={workspaceAccentCssVars()}
      className="flex h-[100dvh] w-full max-w-[100vw] overflow-hidden bg-[var(--workspace-bg)] font-[family-name:var(--font-noto-kr)] text-[var(--workspace-text)]"
    >
      {mobileNav && (
        <button type="button" aria-label={t("nav.closeMenu")} className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setMobileNav(false)} />
      )}

      <div
        className={[
          "h-full shrink-0",
          "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:shadow-2xl max-md:transition-transform max-md:duration-300",
          mobileNav ? "max-md:translate-x-0" : "max-md:-translate-x-full",
          "md:relative md:z-auto md:shadow-none",
        ].join(" ")}
      >
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => {
            setActiveSessionId(id);
            setMobileNav(false);
          }}
          onNewChat={() => void handleNewChat()}
          onDeleteSession={async (id) => {
            await removeSession(id);
            if (id === activeSessionId) {
              const next = sessions.find((s) => s.id !== id);
              setActiveSessionId(next?.id ?? null);
            }
          }}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 border-b border-[var(--workspace-border)] bg-[var(--workspace-surface)] px-3 py-2 md:hidden">
          <button type="button" onClick={() => setMobileNav(true)} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[var(--workspace-bg)]" aria-label={t("nav.menu")}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold">ZEFF AI</span>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <ChatWorkspace
            sessionId={activeSessionId}
            onSessionCreated={(id) => {
              setActiveSessionId(id);
              upsertSession({
                id,
                title: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                messageCount: 1,
              });
              void refetch();
            }}
            onTurnSaved={() => void refetch()}
            onOpenBookChat={(sessionId) => {
              setActiveSessionId(sessionId);
              void refetch();
            }}
          />
        </div>
      </div>
    </div>
  );
}
