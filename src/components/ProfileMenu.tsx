"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Settings, UserRound } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useSettings } from "@/lib/useSettings";
import SettingsModal from "./SettingsModal";
import ThemeToggle from "@/components/ThemeToggle";

const PLAN_LABEL_KEY = {
  free: "sidebar.plan.free",
  pro: "sidebar.plan.pro",
  professional: "sidebar.plan.professional",
} as const;

export default function ProfileMenu() {
  const t = useT();
  const { data: session } = useSession();
  const settingsHook = useSettings();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const plan = settingsHook.settings?.plan ?? "free";

  return (
    <div ref={rootRef} className="relative border-t border-slate-200 p-3 dark:border-slate-800">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
        >
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full border border-slate-200 dark:border-slate-700/60"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-500">
              <UserRound className="h-4 w-4 text-white" />
            </div>
          )}
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-xs font-medium text-slate-700 dark:text-slate-200">
              {session?.user?.name ?? "사용자"}
            </span>
            <span className="block truncate text-[11px] text-slate-500 dark:text-slate-500">
              {t(PLAN_LABEL_KEY[plan])}
            </span>
          </span>
        </button>
        <ThemeToggle className="shrink-0" />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-700/60 dark:bg-slate-900/95 dark:shadow-black/40 dark:backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSettingsOpen(true);
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
            >
              <Settings className="h-4 w-4" />
              {t("profile.settings")}
            </button>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-slate-100 dark:text-red-400 dark:hover:bg-slate-800/60"
            >
              <LogOut className="h-4 w-4" />
              {t("profile.logout")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
