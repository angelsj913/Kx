"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { UserRound, Settings, Sparkles, LifeBuoy, LogOut, ChevronUp } from "lucide-react";
import SettingsModal from "@/components/SettingsModal";

/** 사이드바 맨 아래 프로필 영역. 클릭하면 설정/요금제/도움/로그아웃 팝오버가 뜬다. */
export default function ProfileMenu() {
  const { data: session } = useSession();
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
  const email = session?.user?.email ?? "";

  return (
    <div ref={rootRef} className="relative border-t border-slate-800/60 p-2 sm:p-3">
      {open && (
        <div className="absolute bottom-full left-2 right-2 mb-2 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-md sm:left-3 sm:right-3">
          <MenuItem
            icon={Settings}
            label="설정"
            onClick={() => {
              setOpen(false);
              setSettingsOpen(true);
            }}
          />
          <MenuItem icon={Sparkles} label="요금제" note="준비 중" onClick={() => setOpen(false)} />
          <MenuItem icon={LifeBuoy} label="도움" note="준비 중" onClick={() => setOpen(false)} />
          <div className="border-t border-slate-800/60" />
          <MenuItem
            icon={LogOut}
            label="로그아웃"
            className="text-red-500 hover:bg-red-500/10"
            onClick={() => signOut({ callbackUrl: "/" })}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-800/60 sm:px-3"
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
          <p className="truncate text-[11px] text-slate-500">{email}</p>
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
      className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800/60 ${className}`}
    >
      <span className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </span>
      {note && <span className="text-[11px] font-normal text-slate-500">{note}</span>}
    </button>
  );
}
