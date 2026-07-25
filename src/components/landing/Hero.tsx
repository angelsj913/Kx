"use client";

import { useState } from "react";
import { Download, Apple, Smartphone, Sparkles, X } from "lucide-react";
import {
  WINDOWS_DOWNLOAD_URL,
  MAC_DOWNLOAD_URL,
  PLAY_STORE_URL,
} from "@/lib/constants";
import { useLandingT } from "@/lib/landingI18n";
import Logo from "@/components/ui/Logo";

type OS = "windows" | "mac" | "android";

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 5.1 10.5 4v7.5H3V5.1Zm0 13.8L10.5 20v-7.4H3v6.3ZM11.6 3.85 21 2.5v9H11.6V3.85Zm0 16.3L21 21.5v-9H11.6v7.65Z" />
    </svg>
  );
}

export default function Hero() {
  const t = useLandingT();
  const [selected, setSelected] = useState<OS | null>(null);

  const playReady = Boolean(PLAY_STORE_URL);

  const info =
    selected === "windows"
      ? {
          title: t("hero.modal.windowsTitle"),
          note: t("hero.modal.windowsNote"),
          url: WINDOWS_DOWNLOAD_URL,
          ready: true,
          downloadAttr: "zeffai.installer.exe" as string | undefined,
        }
      : selected === "mac"
        ? {
            title: t("hero.modal.macTitle"),
            note: t("hero.modal.macComingSoon"),
            url: MAC_DOWNLOAD_URL,
            ready: false,
            downloadAttr: undefined,
          }
        : selected === "android"
          ? {
              title: t("hero.modal.androidTitle"),
              note: playReady
                ? t("hero.modal.androidNote")
                : t("hero.modal.androidComingSoon"),
              url: PLAY_STORE_URL || "#",
              ready: playReady,
              downloadAttr: undefined,
            }
          : null;

  return (
    <section id="about" className="relative overflow-hidden bg-transparent pb-14 pt-28 sm:pb-20 sm:pt-36">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[140px]" />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 text-center">
        <span className="hero-fade-up mb-5 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-medium text-blue-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-blue-300">
          <Sparkles className="h-3.5 w-3.5" />
          {t("hero.badge")}
        </span>

        <h1 className="hero-fade-up hero-delay-1 max-w-4xl text-4xl font-bold leading-[1.12] tracking-tight text-slate-900 sm:text-6xl dark:text-slate-50">
          {t("hero.title.line1")}
          <br />
          <span className="mt-4 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-3 sm:mt-5 sm:gap-x-4">
            <span className="text-4xl font-bold leading-none tracking-tight text-slate-900 sm:text-6xl dark:text-slate-50">
              {t("hero.title.line2Prefix")}
            </span>
            <Logo size="hero" className="!items-center" />
          </span>
        </h1>

        <p className="hero-fade-up hero-delay-2 mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
          {t("hero.subtitle")}
        </p>

        <div
          id="download"
          className="hero-fade-up hero-delay-3 mt-10 flex w-full max-w-3xl scroll-mt-32 flex-col gap-3 md:flex-row md:flex-wrap md:justify-center"
        >
          <button
            type="button"
            onClick={() => setSelected("windows")}
            className="group flex w-full items-center justify-center gap-3 whitespace-nowrap rounded-2xl bg-blue-600 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:scale-[1.02] hover:bg-blue-500 active:scale-[0.98] md:w-auto md:min-w-[11rem] md:flex-1"
          >
            <WindowsIcon className="h-6 w-6" />
            {t("hero.download.windows")}
            <Download className="ml-1 h-4 w-4 opacity-70 transition-transform duration-300 group-hover:translate-y-0.5" />
          </button>
          <button
            type="button"
            onClick={() => setSelected("android")}
            className="group flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-emerald-500/40 bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:scale-[1.02] hover:bg-emerald-500 active:scale-[0.98] md:w-auto md:min-w-[12.5rem] md:flex-1"
          >
            <Smartphone className="h-6 w-6" />
            {t("hero.download.android")}
            {!playReady && (
              <span className="ml-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-50">
                {t("hero.download.soon")}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setSelected("mac")}
            className="group flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-slate-300 bg-white px-6 py-4 text-base font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:border-blue-400 hover:scale-[1.02] active:scale-[0.98] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 md:w-auto md:min-w-[12.5rem] md:flex-1"
          >
            <Apple className="h-6 w-6" />
            {t("hero.download.mac")}
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {t("hero.download.soon")}
            </span>
          </button>
        </div>

        <p className="hero-fade-up hero-delay-4 mt-4 text-xs text-slate-500 dark:text-slate-400">
          {t("hero.download.note")}
        </p>
      </div>

      {info && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="close"
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex justify-center">
              <Logo size="lg" />
            </div>
            <h3 className="mt-4 text-center text-lg font-semibold text-slate-900 dark:text-slate-50">
              {info.title}
            </h3>
            <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300">{info.note}</p>
            {info.ready ? (
              <>
                <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
                  {selected === "android"
                    ? t("hero.modal.androidNote")
                    : t("hero.modal.instruction")}
                </p>
                {/* GitHub 릴리스 URL은 교차 출처라 download 속성이 무시된다(GitHub이
                    Content-Disposition으로 강제 다운로드). 새 탭으로 열어 인앱 브라우저
                    (인스타그램 등)에서도 시스템 브라우저로 넘어가 받을 확률을 높인다. */}
                <a
                  href={info.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-500"
                >
                  <Download className="h-4 w-4" />
                  {selected === "android"
                    ? t("hero.modal.androidOpen")
                    : t("hero.modal.confirm")}
                </a>
              </>
            ) : (
              <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                {info.note}
              </p>
            )}
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-3 flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-blue-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {t("hero.modal.cancel")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
