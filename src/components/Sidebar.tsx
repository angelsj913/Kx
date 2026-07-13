"use client";

import { useState } from "react";
import { Plus, MessageSquare, Trash2, BookOpen, Brain, Database, ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n";
import ProfileMenu from "./ProfileMenu";
import Logo from "@/components/ui/Logo";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import type { SessionSummary } from "@/lib/sessions";

export default function Sidebar({
  sessions,
  activeSessionId,
  activeView,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onOpenLibrary,
  onOpenReview,
  onOpenRag,
}: {
  sessions: SessionSummary[];
  activeSessionId: string | null;
  activeView: "chat" | "library" | "review" | "rag";
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onOpenLibrary: () => void;
  onOpenReview: () => void;
  onOpenRag: () => void;
}) {
  const t = useT();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 접었을 때 너비 (아이콘 중앙 정렬에 최적화)
  const collapsedWidth = "w-[64px]";
  const expandedWidth = "w-72";

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-[var(--workspace-border)] bg-[var(--workspace-surface)] transition-all duration-300 ${
        isCollapsed ? collapsedWidth : expandedWidth
      }`}
    >
      {/* 상단: 로고 + 접기 버튼 */}
      <div className="flex h-16 items-center justify-center border-b border-[var(--workspace-border)] px-2">
        {!isCollapsed && <Logo size="sm" withWordmark={true} />}
        {isCollapsed && <Logo size="sm" withWordmark={false} />}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto rounded-lg p-1.5 text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-bg)] transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <WorkspaceSwitcher />

      {/* 메뉴 영역 */}
      <div className="flex flex-col gap-1 p-2">
        {/* 새 대화 */}
        <button
          onClick={onNewChat}
          title={isCollapsed ? t("sidebar.newChat") : undefined}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-md hover:brightness-105 transition-all"
        >
          <Plus size={18} />
          {!isCollapsed && <span className="font-semibold">{t("sidebar.newChat")}</span>}
        </button>

        {/* 내 서재 */}
        <button
          onClick={onOpenLibrary}
          title={isCollapsed ? t("sidebar.myLibrary") : undefined}
          className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm transition-colors ${
            activeView === "library"
              ? "bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
              : "text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-bg)]"
          }`}
        >
          <BookOpen size={18} className="shrink-0" />
          {!isCollapsed && <span>{t("sidebar.myLibrary")}</span>}
        </button>

        {/* 복습 */}
        <button
          onClick={onOpenReview}
          title={isCollapsed ? "복습" : undefined}
          className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm transition-colors ${
            activeView === "review"
              ? "bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
              : "text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-bg)]"
          }`}
        >
          <Brain size={18} className="shrink-0" />
          {!isCollapsed && <span>복습</span>}
        </button>

        {/* 지식 검색 */}
        <button
          onClick={onOpenRag}
          title={isCollapsed ? "지식 검색" : undefined}
          className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm transition-colors ${
            activeView === "rag"
              ? "bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
              : "text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-bg)]"
          }`}
        >
          <Database size={18} className="shrink-0" />
          {!isCollapsed && <span>지식 검색</span>}
        </button>
      </div>

      {/* 채팅 세션 목록 */}
      <div className="flex min-h-0 flex-1 flex-col px-2 pb-2">
        {!isCollapsed && (
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-[var(--workspace-text-secondary)]">
            최근 대화
          </div>
        )}

        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {sessions.map((session) => (
            <li
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              title={isCollapsed ? session.title || "새 대화" : undefined}
              className={`group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                session.id === activeSessionId
                  ? "bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                  : "hover:bg-[var(--workspace-bg)] text-[var(--workspace-text-secondary)]"
              }`}
            >
              <MessageSquare size={16} className="shrink-0 text-blue-600 dark:text-blue-400" />
              {!isCollapsed && <span className="truncate">{session.title || "새 대화"}</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* 하단 프로필 */}
      <div className="border-t border-[var(--workspace-border)] p-3">
        <ProfileMenu />
      </div>
    </aside>
  );
}
