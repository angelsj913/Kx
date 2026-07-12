"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, MessageSquare, Trash2, BookOpen, Brain } from "lucide-react";
import { useT } from "@/lib/i18n";
import ProfileMenu from "./ProfileMenu";
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
}: {
  sessions: SessionSummary[];
  activeSessionId: string | null;
  activeView: "chat" | "library" | "review";
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onOpenLibrary: () => void;
  onOpenReview: () => void;
}) {
  const t = useT();

  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-slate-800/60 bg-slate-900/40 backdrop-blur-md sm:w-64">
      <div className="flex items-center gap-2.5 border-b border-slate-800/60 px-3 py-4 sm:px-5">
        <Image
          src="/logo-zeff.jpg"
          alt="zeff"
          width={32}
          height={32}
          className="shrink-0 rounded-lg"
        />
        <span className="hidden text-sm font-bold tracking-tight text-slate-50 sm:block">
          zeff
        </span>
      </div>

      <WorkspaceSwitcher />

      <div className="p-2 sm:p-3">
        <motion.button
          type="button"
          onClick={onNewChat}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          className="flex w-full items-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-colors"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">{t("sidebar.newChat")}</span>
        </motion.button>

        <button
          type="button"
          onClick={onOpenLibrary}
          className={`mt-1.5 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            activeView === "library"
              ? "bg-violet-600/20 text-violet-200 ring-1 ring-violet-500/40"
              : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
          }`}
        >
          <BookOpen className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">{t("sidebar.myLibrary")}</span>
        </button>

        <button
          type="button"
          onClick={onOpenReview}
          className={`mt-1.5 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            activeView === "review"
              ? "bg-violet-600/20 text-violet-200 ring-1 ring-violet-500/40"
              : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
          }`}
        >
          <Brain className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">복습</span>
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-2 pb-2 sm:px-3">
        <p className="mb-1 hidden px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 sm:block">
          {t("sidebar.library")}
        </p>
        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {sessions.length === 0 && (
            <li className="hidden px-2 py-6 text-center text-xs text-slate-600 sm:block">
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
                      ? "bg-violet-600/20 ring-1 ring-violet-500/40"
                      : "hover:bg-slate-800/60"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                    <span className="hidden truncate text-xs text-slate-300 sm:inline">
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
                    className="hidden shrink-0 text-slate-600 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100 sm:inline-block"
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
