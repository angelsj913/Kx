"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Apple, Smartphone, X, ArrowRight, Sparkles, FileText, Presentation } from "lucide-react";
import {
  WINDOWS_DOWNLOAD_URL,
  MAC_DOWNLOAD_URL,
  PLAY_STORE_URL,
} from "@/lib/constants";
import { useLandingT } from "@/lib/landingI18n";
import { useReducedMotion } from "@/lib/useReducedMotion";
import Logo from "@/components/ui/Logo";

type OS = "windows" | "mac" | "android";

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 5.1 10.5 4v7.5H3V5.1Zm0 13.8L10.5 20v-7.4H3v6.3ZM11.6 3.85 21 2.5v9H11.6V3.85Zm0 16.3L21 21.5v-9H11.6v7.65Z" />
    </svg>
  );
}

const SHOW_DOWNLOAD_CTA = process.env.NEXT_PUBLIC_SHOW_DOWNLOAD_CTA === "1";

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6" aria-hidden>
      <div className="overflow-hidden rounded-t-2xl border border-b-0 border-slate-200/90 bg-white/95 shadow-[0_-12px_48px_-16px_rgba(15,23,42,0.25)] backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-950/95">
        <div className="flex items-center gap-2 border-b border-slate-200/80 px-3 py-2.5 dark:border-slate-800">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
          </span>
          <div className="ml-2 flex flex-1 items-center gap-2 rounded-md bg-slate-100 px-2.5 py-1 dark:bg-slate-900">
            <span className="text-[10px] font-medium text-slate-500">zeffai.com/app</span>
          </div>
        </div>
        <div className="grid min-h-[14rem] grid-cols-[4.5rem_1fr] sm:min-h-[18rem] sm:grid-cols-[11rem_1fr_14rem]">
          <aside className="border-r border-slate-200/80 bg-slate-50/90 p-2.5 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="mb-3 flex items-center gap-2 px-1">
              <Logo size="sm" />
            </div>
            <div className="space-y-1.5">
              {["강의 요약", "STEM 풀이", "리포트"].map((label, i) => (
                <div
                  key={label}
                  className={`rounded-lg px-2 py-1.5 text-[10px] font-medium sm:text-[11px] ${
                    i === 0
                      ? "bg-[var(--landing-accent-muted)] text-[var(--landing-accent)]"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>
          </aside>
          <div className="flex flex-col bg-white dark:bg-slate-950">
            <div className="flex-1 space-y-3 p-3 sm:p-4">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[var(--landing-accent)] px-3 py-2 text-[11px] leading-snug text-white sm:text-xs">
                이번 주 강의 PDF 핵심만 정리하고 PPT 초안까지 만들어줘
              </div>
              <div className="max-w-[92%] space-y-2 rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--landing-accent)]">
                  <Sparkles className="h-3 w-3" />
                  ZEFF
                </div>
                <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 sm:text-xs">
                  핵심 3개 섹션으로 요약했습니다. 오른쪽에서 DOCX·PPTX 초안을 바로 열 수 있어요.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    <FileText className="h-3 w-3" /> 요약.docx
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    <Presentation className="h-3 w-3" /> 발표.pptx
                  </span>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200/80 px-3 py-2.5 dark:border-slate-800">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-400 dark:border-slate-700 dark:bg-slate-900">
                다음 작업을 이어가세요…
              </div>
            </div>
          </div>
          <aside className="hidden border-l border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/50 sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">미리보기</p>
            <div className="mt-2 space-y-2">
              <div className="h-2 w-3/4 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-2 w-5/6 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="aspect-[4/3] rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950" />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const t = useLandingT();
  const reducedMotion = useReducedMotion();
  const startHref = "/app";
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
    <section id="about" className="relative overflow-hidden bg-transparent pb-0 pt-24 sm:pt-28">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {reducedMotion ? (
          <img
            src="/landing/hero-poster.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/landing/hero-poster.jpg"
          >
            <source src="/landing/hero-loop.mp4" type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white dark:from-slate-950/85 dark:via-slate-950/75 dark:to-slate-950" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 text-center">
        <span className="landing-label hero-fade-up mb-3 inline-block text-[10px] font-medium text-[color:var(--landing-text-muted)]">
          {t("hero.badge")}
        </span>

        <h1 className="hero-fade-up hero-delay-1 mt-1 max-w-4xl text-3xl font-bold leading-[1.12] tracking-tight text-[color:var(--landing-text-primary)] sm:text-5xl">
          {t("hero.title.line1")}
          <br />
          <span className="mt-2 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:mt-3 sm:gap-x-4">
            <span className="text-3xl font-bold leading-none tracking-tight sm:text-5xl">
              {t("hero.title.line2Prefix")}
            </span>
            <Logo size="hero" className="!items-center" />
          </span>
        </h1>

        <p className="hero-fade-up hero-delay-2 mt-4 max-w-xl text-sm leading-relaxed text-[color:var(--landing-text-muted)] sm:mt-5 sm:text-base">
          {t("hero.subtitle")}
        </p>

        {!SHOW_DOWNLOAD_CTA && (
          <Link
            href={startHref}
            className="hero-fade-up hero-delay-3 mt-7 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--landing-accent)] px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            {t("header.startWeb")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}

        {SHOW_DOWNLOAD_CTA && (
          <>
            <div
              id="download"
              className="hero-fade-up hero-delay-3 mt-7 flex w-full max-w-3xl scroll-mt-32 flex-col gap-3 md:flex-row md:flex-wrap md:justify-center"
            >
              <button
                type="button"
                onClick={() => setSelected("windows")}
                className="group flex w-full items-center justify-center gap-3 rounded-full bg-[var(--landing-accent)] px-5 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98] sm:px-7 md:w-auto md:min-w-[11rem] md:flex-1 md:whitespace-nowrap"
              >
                <WindowsIcon className="h-6 w-6" />
                {t("hero.download.windows")}
                <Download className="ml-1 h-4 w-4 opacity-70 transition-transform duration-300 group-hover:translate-y-0.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelected("android")}
                className="group flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3.5 text-base font-semibold text-slate-700 transition-colors hover:border-slate-400 active:scale-[0.98] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 sm:px-6 md:w-auto md:min-w-[12.5rem] md:flex-1 md:whitespace-nowrap"
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
                className="group flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3.5 text-base font-semibold text-slate-700 transition-colors hover:border-slate-400 active:scale-[0.98] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 sm:px-6 md:w-auto md:min-w-[12.5rem] md:flex-1 md:whitespace-nowrap"
              >
                <Apple className="h-6 w-6" />
                {t("hero.download.mac")}
                <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {t("hero.download.soon")}
                </span>
              </button>
            </div>

            <p className="hero-fade-up hero-delay-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
              {t("hero.download.note")}
            </p>
          </>
        )}
      </div>

      <div className="hero-fade-up hero-delay-4 relative z-10 mt-8 sm:mt-10">
        <ProductPreview />
      </div>

      {SHOW_DOWNLOAD_CTA && info && (
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
                <a
                  href={info.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--landing-accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-opacity hover:opacity-90"
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
