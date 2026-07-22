"use client";

import { useState } from "react";
import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n";
import ProfileMenu from "./ProfileMenu";
import Logo from "@/components/ui/Logo";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import type { SessionSummary } from "@/lib/sessions";

const ICON = 16;

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: {
  sessions: SessionSummary[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}) {
  const t = useT();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingSession = sessions.find((s) => s.id === pendingDeleteId);

  return (
    <aside
      className={`flex h-full max-h-[100dvh] shrink-0 flex-col border-r border-[var(--workspace-border)] bg-[var(--workspace-surface)] transition-[width] duration-300 ${
        isCollapsed ? "w-16" : "w-72"
      }`}
    >
      <div
        className={`flex h-14 shrink-0 items-center border-b border-[var(--workspace-border)] ${
          isCollapsed ? "justify-center px-1" : "justify-between gap-1 px-3"
        }`}
      >
        {isCollapsed ? (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            title={t("sidebar.expand")}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-[var(--workspace-bg)]"
          >
            <span className="transition-opacity group-hover:opacity-0">
              <Logo size="sm" withWordmark={false} />
            </span>
            <ChevronRight size={ICON} className="absolute opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ) : (
          <>
            <Logo size="md" withWordmark className="min-w-0" />
            <button type="button" onClick={() => setIsCollapsed(true)} title={t("sidebar.collapse")} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--workspace-bg)]">
              <ChevronLeft size={ICON} />
            </button>
          </>
        )}
      </div>

      <WorkspaceSwitcher collapsed={isCollapsed} />

      <div className={`shrink-0 ${isCollapsed ? "p-1.5" : "p-2"}`}>
        <button
          type="button"
          onClick={onNewChat}
          title={t("sidebar.newChat")}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-md"
        >
          <Plus size={ICON} />
          {!isCollapsed && <span className="font-semibold">{t("sidebar.newChat")}</span>}
        </button>
      </div>

      <div className={`flex min-h-0 flex-1 flex-col ${isCollapsed ? "px-1.5" : "px-2"}`}>
        {!isCollapsed && (
          <p className="mb-1 shrink-0 px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--workspace-text-secondary)]">
            {t("sidebar.library")}
          </p>
        )}
        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pb-2">
          {sessions.length === 0 && !isCollapsed && (
            <li className="px-2 py-6 text-center text-xs text-[var(--workspace-text-secondary)]">{t("sidebar.libraryEmpty")}</li>
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
                    ? "bg-blue-600/10 text-blue-700 ring-1 ring-blue-500/40 dark:text-blue-300"
                    : "text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-bg)]"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <MessageSquare size={ICON} className="shrink-0 text-blue-600 dark:text-blue-400" />
                  {!isCollapsed && <span className="truncate text-xs">{s.title || t("sidebar.newChat")}</span>}
                </span>
                {!isCollapsed && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDeleteId(s.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        setPendingDeleteId(s.id);
                      }
                    }}
                    aria-label={t("sidebar.deleteChat")}
                    className="shrink-0 opacity-0 group-hover:opacity-100 hover:text-red-500"
                  >
                    <Trash2 size={ICON} />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto shrink-0 border-t border-[var(--workspace-border)]">
        <ProfileMenu collapsed={isCollapsed} />
      </div>

      {pendingDeleteId && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-chat-title"
          onClick={() => setPendingDeleteId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-chat-title" className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {t("sidebar.deleteConfirmTitle")}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {t("sidebar.deleteConfirmBody").replace(
                "{title}",
                pendingSession?.title || t("sidebar.newChat"),
              )}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-200"
              >
                {t("sidebar.deleteCancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSession(pendingDeleteId);
                  setPendingDeleteId(null);
                }}
                className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-500"
              >
                {t("sidebar.deleteConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
