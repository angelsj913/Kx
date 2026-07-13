"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Settings, UserRound, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useT } from "@/lib/i18n";
import { useSettings } from "@/lib/useSettings";
import SettingsModal from "./SettingsModal";
import ThemeToggle from "@/components/ThemeToggle";

const PLAN_LABEL_KEY = {
  free: "sidebar.plan.free",
  pro: "sidebar.plan.pro",
  professional: "sidebar.plan.professional",
} as const;

const ICON = "h-4 w-4 shrink-0";

/** 현재 로그인 사용자 표시명 — 계정마다 달라야 한다. */
function displayName(user: {
  name?: string | null;
  username?: string | null;
  email?: string | null;
} | undefined): string {
  if (!user) return "사용자";
  const name = user.name?.trim();
  if (name) return name;
  const username = user.username?.trim();
  if (username) return username;
  const email = user.email?.trim();
  if (email) return email.split("@")[0] || email;
  return "사용자";
}

export default function ProfileMenu({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const t = useT();
  const { data: session, status } = useSession();
  const userId = session?.user?.id ?? null;
  const settingsHook = useSettings(userId);
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    setOpen(false);
    setSettingsOpen(false);
  }, [userId]);

  const plan = settingsHook.settings?.plan ?? "free";
  const user = session?.user;
  const label = displayName(user);

  return (
    <div
      ref={rootRef}
      key={userId ?? "signed-out"}
      className={`relative shrink-0 overflow-hidden border-t border-[var(--workspace-border)] ${
        collapsed ? "p-1.5" : "p-2 sm:p-3"
      }`}
    >
      {collapsed ? (
        /* 접힌 상태: 아바타만 중앙 — 테마 토글은 메뉴 안으로 */
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          title={label}
          className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-[var(--workspace-bg)]"
        >
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={user.image}
              src={user.image}
              alt=""
              className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700/60"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-500">
              <UserRound className={`${ICON} text-white`} />
            </div>
          )}
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-200 hover:bg-[var(--workspace-bg)]"
          >
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={user.image}
                src={user.image}
                alt=""
                className="h-8 w-8 shrink-0 rounded-full border border-slate-200 dark:border-slate-700/60"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-500">
                <UserRound className={`${ICON} text-white`} />
              </div>
            )}
            <span className="min-w-0">
              <span
                className="block truncate text-xs font-medium text-slate-700 dark:text-slate-200"
                title={user?.email ?? label}
              >
                {status === "loading" ? "…" : label}
              </span>
              <span className="block truncate text-[11px] text-slate-500">
                {t(PLAN_LABEL_KEY[plan])}
              </span>
            </span>
          </button>
          <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-full">
            <ThemeToggle className="shrink-0" compact />
          </div>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={`absolute z-40 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-700/60 dark:bg-slate-900/95 dark:shadow-black/40 dark:backdrop-blur-md ${
              collapsed
                ? "bottom-full left-full ml-1 w-52"
                : "bottom-full left-2 right-2"
            }`}
          >
            {user?.email && (
              <div className="border-b border-slate-100 px-3.5 py-2 dark:border-slate-800">
                <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-100">
                  {label}
                </p>
                <p className="truncate text-[11px] text-slate-500">{user.email}</p>
              </div>
            )}
            {/* 접힌 상태: 테마 전환을 메뉴 항목으로 */}
            {collapsed && (
              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
              >
                {isDark ? <Sun className={ICON} /> : <Moon className={ICON} />}
                {isDark ? "라이트 모드" : "다크 모드"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSettingsOpen(true);
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
            >
              <Settings className={ICON} />
              {t("profile.settings")}
            </button>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-slate-100 dark:text-red-400 dark:hover:bg-slate-800/60"
            >
              <LogOut className={ICON} />
              {t("profile.logout")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
