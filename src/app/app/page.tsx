"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const { sessions, loading, refetch, removeSession, createSession, upsertSession } =
    useSessions();

  /** 워크스페이스/목록 로딩 사이클마다 한 번만 활성 세션 결정 */
  const selectedForLoad = useRef(false);

  /** 새 대화 — 사용자가 버튼 누를 때만 */
  const handleNewChat = useCallback(async () => {
    setView("chat");
    setMobileNav(false);
    try {
      const s = await createSession("새 대화");
      setActiveSessionId(s.id);
    } catch {
      setActiveSessionId(null);
    }
  }, [createSession]);

  /**
   * 입장 시:
   * 1) 이전 대화 목록을 라이브러리에 표시 (sessions 그대로)
   * 2) 화면은 항상 빈 새 대화로 시작 (라이브러리 채팅 내역을 자동으로 열지 않음)
   * 3) 자동으로 「새 대화」 세션을 만들지 않음 — 실제 메시지를 보낼 때 생성
   */
  useEffect(() => {
    if (loading) {
      selectedForLoad.current = false;
      return;
    }
    if (selectedForLoad.current) return;
    selectedForLoad.current = true;
    setActiveSessionId(null);
  }, [loading, sessions]);

  // 워크스페이스 전환으로 다시 로딩되면 선택 초기화
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
        <button
          type="button"
          aria-label="메뉴 닫기"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileNav(false)}
        />
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
          activeView={view}
          onSelectSession={(id) => {
            setActiveSessionId(id);
            setView("chat");
            setMobileNav(false);
          }}
          onNewChat={() => {
            void handleNewChat();
          }}
          onDeleteSession={async (id) => {
            await removeSession(id);
            if (id === activeSessionId) {
              const next = sessions.find((s) => s.id !== id);
              setActiveSessionId(next?.id ?? null);
            }
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
                upsertSession({
                  id,
                  title: "새 대화",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  messageCount: 1,
                });
                void refetch();
              }}
              onTurnSaved={() => {
                void refetch();
              }}
            />
          )}
          {view === "library" && (
            <LibraryView
              onOpenBookChat={(sessionId) => {
                setActiveSessionId(sessionId);
                void refetch();
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
