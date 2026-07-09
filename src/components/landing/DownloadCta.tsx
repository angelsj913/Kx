"use client";

import { useEffect, useState } from "react";
import { Download, Apple, X } from "lucide-react";
import {
  WINDOWS_DOWNLOAD_URL,
  MAC_DOWNLOAD_URL,
} from "@/lib/constants";

type OS = "windows" | "mac";

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 5.1 10.5 4v7.5H3V5.1Zm0 13.8L10.5 20v-7.4H3v6.3ZM11.6 3.85 21 2.5v9H11.6V3.85Zm0 16.3L21 21.5v-9H11.6v7.65Z" />
    </svg>
  );
}

const INFO: Record<
  OS,
  { label: string; note: string; url: string; icon: typeof Apple }
> = {
  windows: {
    label: "Windows",
    note: "Windows 10/11 (64-bit)용 설치 파일(.exe)",
    url: WINDOWS_DOWNLOAD_URL,
    icon: Download,
  },
  mac: {
    label: "Mac",
    note: "macOS용 설치 파일(.dmg)",
    url: MAC_DOWNLOAD_URL,
    icon: Apple,
  },
};

export default function DownloadCta() {
  const [selected, setSelected] = useState<OS | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    if (selected) {
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [selected]);

  const info = selected ? INFO[selected] : null;

  return (
    <>
      <div className="mt-10 flex w-full max-w-xl flex-col gap-4 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => setSelected("windows")}
          className="group flex flex-1 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-4 text-base font-semibold text-white shadow-xl shadow-violet-900/40 transition-all duration-300 hover:scale-[1.02] hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98]"
        >
          <WindowsIcon className="h-6 w-6" />
          <span className="flex flex-col items-start leading-none">
            <span className="text-[11px] font-normal text-violet-200">
              Windows용 설치 파일
            </span>
            Windows 다운로드
          </span>
          <Download className="ml-1 h-4 w-4 opacity-70 transition-transform duration-300 group-hover:translate-y-0.5" />
        </button>
        <button
          type="button"
          onClick={() => setSelected("mac")}
          className="group flex flex-1 items-center justify-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-800/50 px-7 py-4 text-base font-semibold text-slate-100 shadow-xl shadow-black/30 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-violet-500/50 active:scale-[0.98]"
        >
          <Apple className="h-6 w-6" />
          <span className="flex flex-col items-start leading-none">
            <span className="text-[11px] font-normal text-slate-400">
              macOS용 설치 파일
            </span>
            Mac 다운로드
          </span>
          <Download className="ml-1 h-4 w-4 opacity-70 transition-transform duration-300 group-hover:translate-y-0.5" />
        </button>
      </div>

      {info && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="닫기"
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
              <info.icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-50">
              {info.label} 버전 다운로드
            </h3>
            <p className="mt-2 text-sm text-slate-400">{info.note}</p>
            <p className="mt-1 text-xs text-slate-500">
              내려받은 파일을 실행하고 화면 안내를 따라 설치하세요.
            </p>

            <a
              href={info.url}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-violet-900/40 transition-all hover:scale-[1.02] hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              {info.label} 설치 파일 받기
            </a>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-3 flex w-full items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-800/50 px-6 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-violet-500/50"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </>
  );
}
