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

  // 워크스페이스·목록 로딩이 끝난 뒤 한 번만 부트스트랩
  const bootKey = useRef<string | null>(null);

  /** 새 대화: 타이핑 전에 라이브러리에 「새 대화」가 바로 보이게 */
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
   * 앱 진입 / 워크스페이스 전환:
   * - 기존 대화가 있으면 최근 대화 선택 (목록은 이미 표시)
   * - 없으면 빈 「새 대화」 세션을 만들어 타이핑 전에 라이브러리에 표시
   */
  useEffect(() => {
    if (loading) return;

    // sessions 목록 내용으로 키를 잡으면 생성 직후 재실행되어 중복 생성됨 → loading 경계만
    const key = `ready:${sessions.map((s) => s.id).join(",") || "empty"}`;
    // 같은 empty 상태에서 create 중 재진입 방지
    if (bootKey.current === key || bootKey.current === "creating") return;

    if (sessions.length > 0) {
      bootKey.current = key;
      setActiveSessionId((cur) => {
        if (cur && sessions.some((s) => s.id === cur)) return cur;
        // temp id 는 create 완료 전 — 유지
        if (cur?.startsWith("temp-")) return cur;
        return sessions[0].id;
      });
      return;
    }

    // 목록이 비어 있음 → 타이핑 전에 라이브러리에 올릴 빈 대화 생성
    bootKey.current = "creating";
    void (async () => {
      try {
        const s = await createSession("새 대화");
        setActiveSessionId(s.id);
        bootKey.current = `ready:${s.id}`;
      } catch {
        bootKey.current = null;
      }
    })();
  }, [loading, sessions, createSession]);

  // 워크스페이스가 바뀌면 부트스트랩 키 리셋 (useSessions 가 목록을 다시 불러옴)
  const prevLoading = useRef(loading);
  useEffect(() => {
    if (prevLoading.current && !loading) {
      // 로딩 막 끝남 — empty 부트스트랩 허용
    }
    if (!prevLoading.current && loading) {
      // 다시 로딩 시작 (워크스페이스 전환)
      bootKey.current = null;
      setActiveSessionId(null);
    }
    prevLoading.current = loading;
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
            if (id.startsWith("temp-")) return;
            setActiveSessionId(id);
            setView("chat");
            setMobileNav(false);
          }}
          onNewChat={() => {
            void handleNewChat();
          }}
          onDeleteSession={async (id) => {
            if (id.startsWith("temp-")) return;
            await removeSession(id);
            if (id === activeSessionId) {
              const next = sessions.find((s) => s.id !== id && !s.id.startsWith("temp-"));
              if (next) setActiveSessionId(next.id);
              else {
                bootKey.current = null;
                void handleNewChat();
              }
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
              sessionId={
                activeSessionId && !activeSessionId.startsWith("temp-")
                  ? activeSessionId
                  : null
              }
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
