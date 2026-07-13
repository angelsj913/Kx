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

  return (
    <aside
      className={`relative z-30 flex shrink-0 flex-col overflow-visible border-r border-[var(--workspace-border)] bg-[var(--workspace-surface)] transition-[width] duration-300 ${
        isCollapsed ? "w-16" : "w-72"
      }`}
    >
      {/* 상단: 로고 + 접기/펼치기 (헤더 안에서만) */}
      <div
        className={`flex h-14 shrink-0 items-center border-b border-[var(--workspace-border)] ${
          isCollapsed ? "justify-center px-1" : "justify-between gap-1 px-3"
        }`}
      >
        {isCollapsed ? (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            title="사이드바 펼치기"
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-[var(--workspace-bg)]"
          >
            <Logo size="sm" withWordmark={false} />
          </button>
        ) : (
          <>
            <Logo size="md" withWordmark className="min-w-0" />
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              title="사이드바 접기"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--workspace-text-secondary)] transition-colors hover:bg-[var(--workspace-bg)]"
            >
              <ChevronLeft size={ICON} />
            </button>
          </>
        )}
      </div>

      {/* 접힌 상태: 헤더 아래 펼치기 버튼 (라인 안으로) */}
      {isCollapsed && (
        <div className="flex shrink-0 items-center justify-center border-b border-[var(--workspace-border)] py-1">
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            title="사이드바 펼치기"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--workspace-text-secondary)] transition-colors hover:bg-[var(--workspace-bg)] hover:text-blue-600"
          >
            <ChevronRight size={ICON} />
          </button>
        </div>
      )}

      <WorkspaceSwitcher collapsed={isCollapsed} />

      <div className={`flex flex-col gap-1 ${isCollapsed ? "p-1.5" : "p-2"}`}>
        <button
          type="button"
          onClick={onNewChat}
          title={isCollapsed ? t("sidebar.newChat") : undefined}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-md transition-all hover:brightness-105"
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

      <div className={`flex min-h-0 flex-1 flex-col pb-2 ${isCollapsed ? "px-1.5" : "px-2"}`}>
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
                className={`group flex w-full items-center gap-2 rounded-xl py-2 text-left text-sm transition-colors ${
                  isCollapsed ? "justify-center px-0" : "justify-between px-2.5"
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

      <ProfileMenu collapsed={isCollapsed} />
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
      className={`flex h-10 w-full items-center rounded-xl text-sm transition-colors ${
        collapsed ? "justify-center px-0" : "gap-3 px-3"
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
