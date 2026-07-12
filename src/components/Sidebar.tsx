"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, MessageSquare, Trash2, BookOpen } from "lucide-react";
import { useT } from "@/lib/i18n";
import ProfileMenu from "./ProfileMenu";
import Logo from "@/components/ui/Logo";
import type { SessionSummary } from "@/lib/sessions";

export default function Sidebar({
  sessions,
  activeSessionId,
  activeView,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onOpenLibrary,
}: {
  sessions: SessionSummary[];
  activeSessionId: string | null;
  activeView: "chat" | "library";
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onOpenLibrary: () => void;
}) {
  const t = useT();

  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-slate-200 bg-white/80 backdrop-blur-md sm:w-64 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center gap-2.5 border-b border-slate-200 px-3 py-4 sm:px-5 dark:border-slate-800">
        <Logo size="sm" withWordmark={false} className="sm:hidden" />
        <span className="hidden sm:block">
          <Logo size="sm" />
        </span>
      </div>

      <div className="p-2 sm:p-3">
        <motion.button
          type="button"
          onClick={onNewChat}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          className="flex w-full items-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-colors"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">{t("sidebar.newChat")}</span>
        </motion.button>

        <button
          type="button"
          onClick={onOpenLibrary}
          className={`mt-1.5 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            activeView === "library"
              ? "bg-blue-600/10 text-blue-700 ring-1 ring-blue-500/40 dark:bg-blue-500/15 dark:text-blue-300"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
          }`}
        >
          <BookOpen className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">{t("sidebar.myLibrary")}</span>
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-2 pb-2 sm:px-3">
        <p className="mb-1 hidden px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:block dark:text-slate-600">
          {t("sidebar.library")}
        </p>
        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {sessions.length === 0 && (
            <li className="hidden px-2 py-6 text-center text-xs text-slate-400 sm:block dark:text-slate-600">
              {t("sidebar.libraryEmpty")}
            </li>
          )}
          <AnimatePresence initial={false}>
            {sessions.map((s) => (
              <motion.li
                key={s.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <button
                  type="button"
                  onClick={() => onSelectSession(s.id)}
                  title={s.title ?? undefined}
                  className={`group flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left transition-colors duration-200 sm:px-3 ${
                    s.id === activeSessionId
                      ? "bg-blue-600/10 ring-1 ring-blue-500/40 dark:bg-blue-500/15"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span className="hidden truncate text-xs text-slate-600 sm:inline dark:text-slate-300">
                      {s.title || t("sidebar.newChat")}
                    </span>
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(s.id);
                    }}
                    className="hidden shrink-0 text-slate-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 sm:inline-block dark:text-slate-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      <ProfileMenu />
    </aside>
  );
}
