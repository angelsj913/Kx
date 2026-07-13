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
  const [loggingOut, setLoggingOut] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 계정 전환 시 메뉴 초기: 루트 key={userId} + 레이아웃 WorkspaceProvider key 로 리마운트

  const plan = settingsHook.settings?.plan ?? "free";
  const user = session?.user;
  const label = displayName(user);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setOpen(false);
    // 세션 종료 후 홈페이지 첫 화면으로 (로그아웃 상태)
    await signOut({ redirect: true, callbackUrl: "/" });
  }

  return (
    <div
      ref={rootRef}
      key={userId ?? "signed-out"}
      className={`relative shrink-0 bg-[var(--workspace-surface)] ${
        collapsed ? "p-1.5" : "p-2 sm:p-3"
      }`}
    >
      {collapsed ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          title={label}
          aria-expanded={open}
          aria-haspopup="menu"
          className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-[var(--workspace-bg)]"
        >
          <Avatar user={user} />
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="menu"
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-200 hover:bg-[var(--workspace-bg)]"
          >
            <Avatar user={user} />
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

      {/* 프로필 메뉴: 설정 · 로그아웃 */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-[100] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/50 ${
              collapsed
                ? "bottom-2 left-full ml-2 w-52"
                : "bottom-full left-2 right-2 mb-2"
            }`}
          >
            {(user?.email || label) && (
              <div className="border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
                <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                  {label}
                </p>
                {user?.email && (
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">{user.email}</p>
                )}
              </div>
            )}

            {collapsed && (
              <button
                type="button"
                role="menuitem"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {isDark ? <Sun className={ICON} /> : <Moon className={ICON} />}
                {isDark ? "라이트 모드" : "다크 모드"}
              </button>
            )}

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setSettingsOpen(true);
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Settings className={ICON} />
              {t("profile.settings")}
            </button>

            <button
              type="button"
              role="menuitem"
              disabled={loggingOut}
              onClick={() => void handleLogout()}
              className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3.5 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-slate-800 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <LogOut className={ICON} />
              {loggingOut ? "로그아웃 중…" : t("profile.logout")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

function Avatar({
  user,
}: {
  user?: { image?: string | null } | null;
}) {
  if (user?.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={user.image}
        src={user.image}
        alt=""
        className="h-8 w-8 shrink-0 rounded-full border border-slate-200 dark:border-slate-700/60"
      />
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-500">
      <UserRound className={`${ICON} text-white`} />
    </div>
  );
}
