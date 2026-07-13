"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ChatWorkspace from "@/components/ChatWorkspace";
import LibraryView from "@/components/LibraryView";
import WorkBoardView from "@/components/WorkBoardView";
import RagView from "@/components/RagView";
import { useSessions } from "@/lib/sessions";
import { workspaceAccentCssVars } from "@/lib/theme";

export type AppView = "chat" | "library" | "board" | "rag";

export default function AppWorkspace() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [view, setView] = useState<AppView>("chat");
  const [mobileNav, setMobileNav] = useState(false);
  const { sessions, refetch, removeSession } = useSessions();

  return (
    <div
      style={workspaceAccentCssVars()}
      className="flex h-[100dvh] w-full max-w-[100vw] overflow-hidden bg-[var(--workspace-bg)] font-[family-name:var(--font-noto-kr)] text-[var(--workspace-text)]"
    >
      {/* 모바일 사이드바 오버레이 */}
      {mobileNav && (
        <button
          type="button"
          aria-label="메뉴 닫기"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileNav(false)}
        />
      )}

      {/*
        모바일: fixed 드로어.
        데스크톱: static flex 자식 (transform 없음 — fixed 모달이 body 기준이어야 함).
        설정/워크스페이스 모달은 createPortal(document.body)로 렌더.
      */}
      <div
        className={[
          "h-full shrink-0",
          // 모바일 오버레이 드로어
          "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:shadow-2xl max-md:transition-transform max-md:duration-300",
          mobileNav ? "max-md:translate-x-0" : "max-md:-translate-x-full",
          // 데스크톱: 일반 플로우, transform 없음
          "md:relative md:z-auto md:shadow-none",
        ].join(" ")}
      >
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          activeView={view}
          onSelectSession={(id) => {
            setActiveSessionId(id);
            setView("chat");
            setMobileNav(false);
          }}
          onNewChat={() => {
            setActiveSessionId(null);
            setView("chat");
            setMobileNav(false);
          }}
          onDeleteSession={async (id) => {
            await removeSession(id);
            if (id === activeSessionId) setActiveSessionId(null);
          }}
          onOpenLibrary={() => {
            setView("library");
            setMobileNav(false);
          }}
          onOpenBoard={() => {
            setView("board");
            setMobileNav(false);
          }}
          onOpenRag={() => {
            setView("rag");
            setMobileNav(false);
          }}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 모바일 상단 바 */}
        <div className="flex shrink-0 items-center gap-2 border-b border-[var(--workspace-border)] bg-[var(--workspace-surface)] px-3 py-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileNav(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-bg)]"
            aria-label="메뉴"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold">ZEFF AI</span>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
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
          {view === "board" && <WorkBoardView />}
          {view === "rag" && <RagView />}
        </div>
      </div>
    </div>
  );
}
