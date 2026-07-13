"use client";

import { useState } from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  BookOpen,
  Brain,
  Database,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import ProfileMenu from "./ProfileMenu";
import Logo from "@/components/ui/Logo";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import type { SessionSummary } from "@/lib/sessions";

/** 사이드바 내비·액션 아이콘 통일 크기 */
const ICON = 16;

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

  const collapsedWidth = "w-[64px]";
  const expandedWidth = "w-72";

  return (
    <aside
      className={`flex shrink-0 flex-col overflow-x-hidden border-r border-[var(--workspace-border)] bg-[var(--workspace-surface)] transition-all duration-300 ${
        isCollapsed ? collapsedWidth : expandedWidth
      }`}
    >
      {/* 상단: 확대 로고 + 접기 버튼 */}
      <div
        className={`flex h-16 items-center border-b border-[var(--workspace-border)] px-2 ${
          isCollapsed ? "justify-center" : "justify-between gap-1 px-3"
        }`}
      >
        {isCollapsed ? (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            title="사이드바 펼치기"
            className="flex items-center justify-center rounded-lg p-1.5 transition-colors hover:bg-[var(--workspace-bg)]"
          >
            <Logo size="md" withWordmark={false} />
          </button>
        ) : (
          <>
            <Logo size="md" withWordmark />
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              title="사이드바 접기"
              className="shrink-0 rounded-lg p-1.5 text-[var(--workspace-text-secondary)] transition-colors hover:bg-[var(--workspace-bg)]"
            >
              <ChevronLeft size={ICON} />
            </button>
          </>
        )}
        {isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="absolute left-0 top-14 flex w-16 items-center justify-center py-1 text-[var(--workspace-text-secondary)] hover:text-blue-600"
            title="사이드바 펼치기"
          >
            <ChevronRight size={ICON} />
          </button>
        )}
      </div>

      <WorkspaceSwitcher />

      <div className="flex flex-col gap-1 p-2">
        <button
          type="button"
          onClick={onNewChat}
          title={isCollapsed ? t("sidebar.newChat") : undefined}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-md transition-all hover:brightness-105"
        >
          <Plus size={ICON} className="shrink-0" />
          {!isCollapsed && <span className="font-semibold">{t("sidebar.newChat")}</span>}
        </button>

        <NavItem
          active={activeView === "library"}
          collapsed={isCollapsed}
          onClick={onOpenLibrary}
          title={t("sidebar.myLibrary")}
          icon={<BookOpen size={ICON} className="shrink-0" />}
        >
          {t("sidebar.myLibrary")}
        </NavItem>
        <NavItem
          active={activeView === "review"}
          collapsed={isCollapsed}
          onClick={onOpenReview}
          title="복습"
          icon={<Brain size={ICON} className="shrink-0" />}
        >
          복습
        </NavItem>
        <NavItem
          active={activeView === "rag"}
          collapsed={isCollapsed}
          onClick={onOpenRag}
          title="지식 검색"
          icon={<Database size={ICON} className="shrink-0" />}
        >
          지식 검색
        </NavItem>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-2 pb-2">
        {!isCollapsed && (
          <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--workspace-text-secondary)]">
            {t("sidebar.library")}
          </p>
        )}
        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {sessions.length === 0 && !isCollapsed && (
            <li className="px-2 py-6 text-center text-xs text-[var(--workspace-text-secondary)]">
              {t("sidebar.libraryEmpty")}
            </li>
          )}
          {sessions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelectSession(s.id)}
                title={s.title || t("sidebar.newChat")}
                className={`group flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors ${
                  isCollapsed ? "justify-center" : "justify-between"
                } ${
                  s.id === activeSessionId
                    ? "bg-blue-600/10 text-blue-700 ring-1 ring-blue-500/40 dark:bg-blue-500/15 dark:text-blue-300"
                    : "text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-bg)]"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <MessageSquare
                    size={ICON}
                    className="shrink-0 text-blue-600 dark:text-blue-400"
                  />
                  {!isCollapsed && (
                    <span className="truncate text-xs">{s.title || t("sidebar.newChat")}</span>
                  )}
                </span>
                {!isCollapsed && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(s.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        onDeleteSession(s.id);
                      }
                    }}
                    className="shrink-0 text-[var(--workspace-text-secondary)] opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 size={ICON} />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <ProfileMenu />
    </aside>
  );
}

function NavItem({
  active,
  collapsed,
  onClick,
  title,
  icon,
  children,
}: {
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? title : undefined}
      className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm transition-colors ${
        collapsed ? "justify-center px-0" : ""
      } ${
        active
          ? "bg-blue-600/10 text-blue-700 ring-1 ring-blue-500/40 dark:bg-blue-500/15 dark:text-blue-300"
          : "text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-bg)]"
      }`}
    >
      {icon}
      {!collapsed && <span>{children}</span>}
    </button>
  );
}
