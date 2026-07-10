"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, LifeBuoy } from "lucide-react";
import { ALL_RELEASES_URL } from "@/lib/constants";
import { LANDING_MODE_STYLE } from "@/lib/landingTheme";
import type { AppMode } from "@/lib/tools";
import SupportModal from "./SupportModal";

const MODES: AppMode[] = ["office", "student"];

export default function Header() {
  const [mode, setMode] = useState<AppMode>("office");
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <>
      <header className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-50">
            zeff
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-slate-700/60 bg-slate-900/60 p-1 backdrop-blur-md">
          {MODES.map((m) => {
            const s = LANDING_MODE_STYLE[m];
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={active}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ${
                  active
                    ? `${s.iconBg} text-white shadow-md`
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {s.shortName} 모드
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-100"
          >
            <LifeBuoy className="h-4 w-4" />
            Support
          </button>
          <a
            href={ALL_RELEASES_URL}
            className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-100"
          >
            모든 버전 보기
          </a>
          <Link
            href="/login"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-100"
          >
            로그인
          </Link>
        </div>
      </header>

      <SupportModal
        open={supportOpen}
        mode={mode}
        onClose={() => setSupportOpen(false)}
      />
    </>
  );
}
