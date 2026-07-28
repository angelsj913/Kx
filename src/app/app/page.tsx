"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [openLibrary, setOpenLibrary] = useState(false);
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
    if (searchParams.get("newChat") === "1") {
      void handleNewChat();
      router.replace("/app");
      return;
    }
    if (searchParams.get("library") === "1") {
      setOpenLibrary(true);
      router.replace("/app");
    }
  }, [searchParams, handleNewChat, router]);

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

  // 소프트 키보드 대응. dvh 는 주소창 변화만 반영하고 키보드는 반영하지 않아서,
  // 키보드가 올라오면 100dvh 셸의 아래쪽(= 채팅 입력창)이 키보드 뒤에 영구히 가렸다.
  // Android/Chrome 은 viewport 의 interactiveWidget 이 처리하지만 iOS Safari 는 이를
  // 무시하므로, 실제로 보이는 영역인 visualViewport 높이를 셸 높이로 쓴다.
  // rAF 스로틀 패턴은 LandingViewportScale.tsx 와 동일.
  // 워크스페이스는 모바일 rem 축소(globals.css) 대상에서 뺀다 — 채팅 글자와 입력창까지
  // 작아지면 쓰기 불편해진다. 인라인 스타일이 미디어쿼리를 이긴다.
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = "16px";
    return () => { root.style.fontSize = ""; };
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let raf = 0;

    const apply = () => {
      document.documentElement.style.setProperty("--app-vh", `${vv.height}px`);
      // iOS 는 키보드가 열릴 때 레이아웃 뷰포트를 밀어 올린다. 되돌리지 않으면
      // 셸 높이를 맞춰도 화면이 어긋난 채로 남는다.
      if (vv.offsetTop > 0) window.scrollTo(0, 0);
    };
    const onChange = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };

    apply();
    vv.addEventListener("resize", onChange);
    vv.addEventListener("scroll", onChange);
    return () => {
      cancelAnimationFrame(raf);
      vv.removeEventListener("resize", onChange);
      vv.removeEventListener("scroll", onChange);
      document.documentElement.style.removeProperty("--app-vh");
    };
  }, []);

  return (
    <div
      style={workspaceAccentCssVars()}
      className="flex h-[var(--app-vh,100dvh)] w-full max-w-[100vw] overflow-hidden bg-[var(--workspace-bg)] font-[family-name:var(--font-noto-kr)] text-[var(--workspace-text)]"
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
            openLibrary={openLibrary}
            onLibraryOpened={() => setOpenLibrary(false)}
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
