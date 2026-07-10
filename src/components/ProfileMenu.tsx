"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { UserRound, Settings, Sparkles, LifeBuoy, LogOut, ChevronUp } from "lucide-react";
import SettingsModal from "@/components/SettingsModal";
import { useT } from "@/lib/i18n";

const PLAN_LABEL_KEY: Record<string, string> = {
  free: "plan.free",
  pro: "plan.pro",
  professional: "plan.professional",
};

/** 사이드바 맨 아래 프로필 영역. 이메일은 숨기고 요금제 상태만 보여준다. */
export default function ProfileMenu({ plan }: { plan: "free" | "pro" | "professional" }) {
  const { data: session } = useSession();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const name = session?.user?.name ?? "사용자";

  return (
    <div ref={rootRef} className="relative border-t border-slate-800/60 p-2 sm:p-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute bottom-full left-2 right-2 mb-2 origin-bottom overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-md sm:left-3 sm:right-3"
          >
            <MenuItem
              icon={Settings}
              label={t("profile.settings")}
              onClick={() => {
                setOpen(false);
                setSettingsOpen(true);
              }}
            />
            <MenuItem icon={Sparkles} label={t("profile.plan")} note={t("profile.comingSoon")} onClick={() => setOpen(false)} />
            <MenuItem icon={LifeBuoy} label={t("profile.help")} note={t("profile.comingSoon")} onClick={() => setOpen(false)} />
            <div className="border-t border-slate-800/60" />
            <MenuItem
              icon={LogOut}
              label={t("profile.logout")}
              className="text-red-500 hover:bg-red-500/10"
              onClick={() => signOut({ callbackUrl: "/" })}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-200 hover:bg-slate-800/60 sm:px-3"
      >
        {session?.user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full border border-slate-700/60"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500">
            <UserRound className="h-4 w-4 text-white" />
          </div>
        )}
        <div className="hidden min-w-0 flex-1 sm:block">
          <p className="truncate text-xs font-semibold text-slate-100">{name}</p>
          <p className="truncate text-[11px] text-violet-300">{t(PLAN_LABEL_KEY[plan] ?? "plan.free")}</p>
        </div>
        <ChevronUp
          className={`hidden h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 sm:block ${open ? "" : "rotate-180"}`}
        />
      </button>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  note,
  className = "",
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  note?: string;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-sm font-medium text-slate-200 transition-colors duration-150 hover:bg-slate-800/60 ${className}`}
    >
      <span className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </span>
      {note && <span className="text-[11px] font-normal text-slate-500">{note}</span>}
    </button>
  );
}
