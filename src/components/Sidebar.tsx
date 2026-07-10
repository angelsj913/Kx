"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Plus, MessageSquare, Trash2 } from "lucide-react";
import ProfileMenu from "@/components/ProfileMenu";
import { useT } from "@/lib/i18n";
import type { SessionSummary } from "@/lib/sessions";

export default function Sidebar({
  sessions,
  sessionsLoading,
  activeSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  plan,
}: {
  sessions: SessionSummary[];
  sessionsLoading: boolean;
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  plan: "free" | "pro" | "professional";
}) {
  const t = useT();

  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-slate-800/60 bg-slate-900/40 backdrop-blur-md sm:w-64">
      <div className="flex items-center gap-2.5 px-3 py-4 sm:px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <span className="hidden text-sm font-bold tracking-tight text-slate-50 sm:block">zeff</span>
      </div>

      <div className="px-2 sm:px-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center gap-2.5 rounded-xl border border-slate-700/60 bg-slate-800/40 px-3 py-2.5 text-sm font-medium text-slate-100 transition-all duration-200 hover:border-violet-500/50 hover:bg-slate-800/70"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">{t("sidebar.newChat")}</span>
        </button>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col px-2 sm:px-3">
        <p className="mb-1 hidden px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 sm:block">
          {t("sidebar.library")}
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!sessionsLoading && sessions.length === 0 && (
            <p className="hidden px-2 py-3 text-xs text-slate-600 sm:block">{t("sidebar.libraryEmpty")}</p>
          )}
          <AnimatePresence initial={false}>
            {sessions.map((s) => {
              const active = s.id === activeSessionId;
              return (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <button
                    type="button"
                    onClick={() => onSelectSession(s.id)}
                    title={s.title ?? t("sidebar.newChat")}
                    className={`group flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors duration-150 sm:px-3 ${
                      active ? "bg-slate-800/80 text-slate-50" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="hidden min-w-0 flex-1 truncate sm:block">{s.title || t("sidebar.newChat")}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={t("sidebar.deleteSession")}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(s.id);
                      }}
                      className="hidden shrink-0 rounded-md p-1 text-slate-600 opacity-0 transition-opacity duration-150 hover:text-red-400 group-hover:opacity-100 sm:block"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <ProfileMenu plan={plan} />
    </aside>
  );
}
