"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Download, Apple, Smartphone, X } from "lucide-react";
import {
  WINDOWS_DOWNLOAD_URL,
  MAC_DOWNLOAD_URL,
  PLAY_STORE_URL,
} from "@/lib/constants";
import { useLandingT } from "@/lib/landingI18n";
import { useLocalCopy } from "@/lib/useLocalCopy";
import type { LandingLanguage } from "@/lib/landingI18n";
import Logo from "@/components/ui/Logo";

type OS = "windows" | "mac" | "android";

type HeroCopy = {
  headline: string;
  support: string;
  ctaPrimary: string;
  ctaPricing: string;
  ctaDownload: string;
};

const COPY: Partial<Record<LandingLanguage, HeroCopy>> & { en: HeroCopy } = {
  ko: {
    headline: "공부와 일을, 한 워크스페이스에서",
    support:
      "강의 요약부터 PPT·엑셀·워드까지. 매번 다시 설명하지 않아도, ZEFF가 맥락을 이어 받습니다.",
    ctaPrimary: "웹에서 시작하기",
    ctaPricing: "요금제 보기",
    ctaDownload: "앱 다운로드",
  },
  en: {
    headline: "Study and work, in one workspace",
    support:
      "From lecture notes to PPT, Excel, and Word — ZEFF keeps your context so you don’t re-explain every time.",
    ctaPrimary: "Start in browser",
    ctaPricing: "See pricing",
    ctaDownload: "Download apps",
  },
  ja: {
    headline: "勉強も仕事も、ひとつのワークスペースで",
    support:
      "講義まとめから PPT・Excel・Word まで。毎回説明し直さなくても、ZEFF が文脈を引き継ぎます。",
    ctaPrimary: "ブラウザで始める",
    ctaPricing: "料金を見る",
    ctaDownload: "アプリを入手",
  },
  zh: {
    headline: "学习与工作，都在一个工作区",
    support: "从讲座笔记到 PPT、Excel、Word——ZEFF 记住上下文，不必每次重新说明。",
    ctaPrimary: "在网页开始",
    ctaPricing: "查看套餐",
    ctaDownload: "下载应用",
  },
};

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 5.1 10.5 4v7.5H3V5.1Zm0 13.8L10.5 20v-7.4H3v6.3ZM11.6 3.85 21 2.5v9H11.6V3.85Zm0 16.3L21 21.5v-9H11.6v7.65Z" />
    </svg>
  );
}

export default function Hero() {
  const t = useLandingT();
  const copy = useLocalCopy(COPY);
  const [selected, setSelected] = useState<OS | null>(null);
  const [showDownloads, setShowDownloads] = useState(false);
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
              note: playReady ? t("hero.modal.androidNote") : t("hero.modal.androidComingSoon"),
              url: PLAY_STORE_URL || "#",
              ready: playReady,
              downloadAttr: undefined,
            }
          : null;

  return (
    <section
      id="about"
      className="relative min-h-[100svh] overflow-hidden pb-16 pt-24 sm:pb-24 sm:pt-28"
    >
      {/* Full-bleed atmosphere — not a flat single color */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 20%, rgba(37,99,235,0.22), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(14,165,233,0.12), transparent 50%), linear-gradient(165deg, #0b1220 0%, #111827 42%, #0f172a 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <div className="text-left">
          <div className="hero-fade-up">
            <Logo size="lg" className="!items-start brightness-110" />
          </div>
          <h1 className="hero-fade-up hero-delay-1 mt-8 max-w-xl font-[family-name:var(--font-landing-display)] text-4xl font-semibold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
            {copy.headline}
          </h1>
          <p className="hero-fade-up hero-delay-2 mt-5 max-w-md text-base leading-relaxed text-slate-300 sm:text-lg">
            {copy.support}
          </p>
          <div className="hero-fade-up hero-delay-3 mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-lg shadow-blue-900/30 transition hover:bg-slate-100"
            >
              {copy.ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-3.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/10"
            >
              {copy.ctaPricing}
            </a>
            <button
              type="button"
              onClick={() => setShowDownloads((v) => !v)}
              className="inline-flex items-center gap-2 px-2 py-3.5 text-sm text-slate-400 underline-offset-4 transition hover:text-slate-200 hover:underline"
            >
              {copy.ctaDownload}
            </button>
          </div>

          {showDownloads && (
            <div
              id="download"
              className="hero-fade-up mt-5 flex scroll-mt-32 flex-wrap gap-2"
            >
              <button
                type="button"
                onClick={() => setSelected("windows")}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200"
              >
                <WindowsIcon className="h-4 w-4" />
                {t("hero.download.windows")}
              </button>
              <button
                type="button"
                onClick={() => setSelected("android")}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200"
              >
                <Smartphone className="h-4 w-4" />
                {t("hero.download.android")}
              </button>
              <button
                type="button"
                onClick={() => setSelected("mac")}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200"
              >
                <Apple className="h-4 w-4" />
                {t("hero.download.mac")}
              </button>
            </div>
          )}
        </div>

        {/* Dominant product visual plane */}
        <div className="hero-fade-up hero-delay-2 relative mx-auto w-full max-w-lg lg:max-w-none">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-950 shadow-2xl shadow-blue-950/50">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.35),transparent_50%)]" />
            <div className="absolute left-4 right-4 top-4 flex items-center gap-2 rounded-lg bg-slate-950/70 px-3 py-2 text-[11px] text-slate-400 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              ZEFF workspace
            </div>
            <div className="absolute inset-x-4 bottom-4 top-14 grid grid-cols-[0.9fr_1.1fr] gap-3">
              <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3">
                <div className="h-2 w-16 rounded bg-slate-600/80" />
                <div className="mt-3 space-y-2">
                  <div className="h-8 rounded-lg bg-blue-500/25 ring-1 ring-blue-400/30" />
                  <div className="h-8 rounded-lg bg-slate-800" />
                  <div className="h-8 rounded-lg bg-slate-800" />
                </div>
              </div>
              <div className="flex flex-col rounded-xl border border-white/10 bg-slate-900/60 p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Chat</div>
                <div className="mt-2 flex-1 space-y-2">
                  <div className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-blue-600/80 px-2.5 py-1.5 text-[11px] text-white">
                    강의 요약 + PPT로
                  </div>
                  <div className="max-w-[90%] rounded-lg rounded-bl-sm bg-slate-800 px-2.5 py-1.5 text-[11px] text-slate-200">
                    아웃라인 12장 구성 완료. 미리보기 열었어요.
                  </div>
                </div>
                <div className="mt-2 h-8 rounded-lg border border-white/10 bg-slate-950/80" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {info && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="close"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="pr-8 text-lg font-bold text-slate-900 dark:text-slate-50">{info.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{info.note}</p>
            {info.ready ? (
              <a
                href={info.url}
                {...(info.downloadAttr ? { download: info.downloadAttr } : {})}
                className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
              >
                <Download className="h-4 w-4" />
                {selected === "android" ? t("hero.modal.androidOpen") : t("hero.modal.confirm")}
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="mt-5 w-full rounded-xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500 dark:bg-slate-800"
              >
                {t("hero.download.soon")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-2 w-full py-2 text-sm text-slate-500"
            >
              {t("hero.modal.cancel")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
