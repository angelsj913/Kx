"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-[var(--workspace-border)] bg-[var(--workspace-surface)] transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-72"
      }`}
    >
      {/* 상단 로고 + 토글 버튼 */}
      <div className="flex items-center justify-between border-b border-[var(--workspace-border)] px-4 py-4">
        <div className="flex items-center gap-2">
          <Logo size="sm" withWordmark={!isCollapsed} />
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-1.5 text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-bg)] transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <WorkspaceSwitcher />

      {/* 메뉴 영역 */}
      <div className="p-3 space-y-1">
        {/* 새 대화 버튼 */}
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/30 hover:brightness-105 transition-all"
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && <span>{t("sidebar.newChat")}</span>}
        </button>

        {/* 메뉴 버튼들 */}
        <button
          onClick={onOpenLibrary}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            activeView === "library"
              ? "bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
              : "text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-bg)]"
          }`}
        >
          <BookOpen className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>{t("sidebar.myLibrary")}</span>}
        </button>

        <button
          onClick={onOpenReview}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            activeView === "review"
              ? "bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
              : "text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-bg)]"
          }`}
        >
          <Brain className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>복습</span>}
        </button>

        <button
          onClick={onOpenRag}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            activeView === "rag"
              ? "bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
              : "text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-bg)]"
          }`}
        >
          <Database className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>지식 검색</span>}
        </button>
      </div>

      {/* 채팅 세션 목록 */}
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-2">
        {!isCollapsed && (
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-[var(--workspace-text-secondary)]">
            최근 대화
          </p>
        )}

        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {sessions.length === 0 && !isCollapsed && (
            <li className="px-3 py-8 text-center text-xs text-[var(--workspace-text-secondary)]">
              아직 대화가 없습니다
            </li>
          )}

          <AnimatePresence>
            {sessions.map((session) => (
              <motion.li
                key={session.id}
                layout
                className={`group flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors cursor-pointer ${
                  session.id === activeSessionId
                    ? "bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                    : "hover:bg-[var(--workspace-bg)] text-[var(--workspace-text-secondary)]"
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  {!isCollapsed && (
                    <span className="truncate text-sm">
                      {session.title || "새 대화"}
                    </span>
                  )}
                </div>

                {!isCollapsed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      {/* 하단 프로필 */}
      <div className="border-t border-[var(--workspace-border)] p-3">
        <ProfileMenu />
      </div>
    </aside>
  );
}
