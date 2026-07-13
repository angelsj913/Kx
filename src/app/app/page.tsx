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
  const bootstrapped = useRef(false);

  /** 새 대화: DB 세션을 바로 만들어 라이브러리에 즉시 표시 */
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

  // 앱 진입 시 활성 세션이 없으면 빈 대화를 하나 만들어 목록에 바로 보이게
  useEffect(() => {
    if (loading || bootstrapped.current) return;
    bootstrapped.current = true;
    if (activeSessionId) return;

    if (sessions.length > 0) {
      // 가장 최근 대화 선택 (입력 전에도 라이브러리에 기존 목록 표시)
      setActiveSessionId(sessions[0].id);
      return;
    }

    void (async () => {
      try {
        const s = await createSession("새 대화");
        setActiveSessionId(s.id);
      } catch {
        /* 로그인 직후 등 실패 시 무시 — 첫 메시지로 생성됨 */
      }
    })();
  }, [loading, sessions, activeSessionId, createSession]);

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
            void handleNewChat();
          }}
          onDeleteSession={async (id) => {
            await removeSession(id);
            if (id === activeSessionId) {
              // 삭제 후 다음 세션 또는 새 대화
              const next = sessions.find((s) => s.id !== id);
              if (next) setActiveSessionId(next.id);
              else void handleNewChat();
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
                upsertSession({
                  id,
                  title: "새 대화",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
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
