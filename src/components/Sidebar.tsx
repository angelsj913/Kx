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
        isCollapsed ? "w-[68px]" : "w-72"
      }`}
    >
      {/* 상단 로고 + 접기 버튼 */}
      <div className="flex h-16 items-center justify-between border-b border-[var(--workspace-border)] px-3">
        <div className="flex items-center">
          <Logo size="sm" withWordmark={!isCollapsed} />
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-1.5 text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-bg)] transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <WorkspaceSwitcher />

      {/* 상단 메뉴 */}
      <div className="p-2.5 space-y-1.5">
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-105 transition-all"
        >
          <Plus size={18} />
          {!isCollapsed && <span>{t("sidebar.newChat")}</span>}
        </button>

        <button
          onClick={onOpenLibrary}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
            activeView === "library"
              ? "bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
              : "text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-bg)]"
          }`}
        >
          <BookOpen size={18} />
          {!isCollapsed && <span>{t("sidebar.myLibrary")}</span>}
        </button>

        <button
          onClick={onOpenReview}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
            activeView === "review"
              ? "bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
              : "text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-bg)]"
          }`}
        >
          <Brain size={18} />
          {!isCollapsed && <span>복습</span>}
        </button>

        <button
          onClick={onOpenRag}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
            activeView === "rag"
              ? "bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
              : "text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-bg)]"
          }`}
        >
          <Database size={18} />
          {!isCollapsed && <span>지식 검색</span>}
        </button>
      </div>

      {/* 채팅 세션 목록 */}
      <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-2">
        {!isCollapsed && (
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-[var(--workspace-text-secondary)]">
            최근 대화
          </div>
        )}

        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {sessions.map((session) => (
            <li
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                session.id === activeSessionId
                  ? "bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                  : "hover:bg-[var(--workspace-bg)] text-[var(--workspace-text-secondary)]"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare size={16} className="shrink-0 text-blue-600 dark:text-blue-400" />
                {!isCollapsed && <span className="truncate">{session.title || "새 대화"}</span>}
              </div>

              {!isCollapsed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* 하단 프로필 */}
      <div className="border-t border-[var(--workspace-border)] p-3">
        <ProfileMenu collapsed={isCollapsed} />
      </div>
    </aside>
  );
}
