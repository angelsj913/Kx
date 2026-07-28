"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Apple, Monitor, HardDrive, Cpu, MemoryStick, CheckCircle2, Package } from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/ui/Logo";
import { useLandingT } from "@/lib/landingI18n";
import {
  WINDOWS_DOWNLOAD_URL,
  MAC_DOWNLOAD_URL,
  WINDOWS_FILENAME,
  MAC_FILENAME,
  APP_VERSION,
  SYSTEM_REQUIREMENTS,
} from "@/lib/constants";

type OS = "windows" | "mac" | "other";

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 5.1 10.5 4v7.5H3V5.1Zm0 13.8L10.5 20v-7.4H3v6.3ZM11.6 3.85 21 2.5v9H11.6V3.85Zm0 16.3L21 21.5v-9H11.6v7.65Z" />
    </svg>
  );
}

export default function DownloadPage() {
  const t = useLandingT();
  const [os, setOs] = useState<OS>("other");

  useEffect(() => {
    (async () => {
      const ua = navigator.userAgent;
      if (/Win/i.test(ua)) setOs("windows");
      else if (/Mac/i.test(ua)) setOs("mac");
    })();
  }, []);

  const platforms = [
    {
      id: "windows" as const,
      name: "Windows",
      icon: WindowsIcon,
      cta: t("downloadPage.windows"),
      url: WINDOWS_DOWNLOAD_URL,
      filename: WINDOWS_FILENAME,
      req: SYSTEM_REQUIREMENTS.windows,
    },
    {
      id: "mac" as const,
      name: "macOS",
      icon: Apple,
      cta: t("downloadPage.mac"),
      url: MAC_DOWNLOAD_URL,
      filename: MAC_FILENAME,
      req: SYSTEM_REQUIREMENTS.mac,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3.5">
          <BackButton fallbackHref="/" forceFallback />
          <Link href="/" className="flex items-center">
            <Logo size="sm" />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="rounded-full bg-blue-600/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
            {t("downloadPage.version")} {APP_VERSION}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{t("downloadPage.title")}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("downloadPage.subtitle")}</p>

        {/* 플랫폼별 다운로드 카드 */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {platforms.map((p) => {
            const isRecommended = os === p.id;
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border p-6 transition-colors ${
                  isRecommended
                    ? "border-blue-500 bg-white shadow-lg shadow-blue-600/10 dark:border-blue-500/60 dark:bg-slate-900"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                {isRecommended && (
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                    <CheckCircle2 className="h-3 w-3" />
                    {t("downloadPage.recommended")}
                  </span>
                )}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                  <Icon className="h-6 w-6 text-slate-700 dark:text-slate-200" />
                </div>
                <h2 className="mt-4 text-lg font-bold">{p.name}</h2>
                <dl className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-3.5 w-3.5 shrink-0" /> {p.req.os}
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5 shrink-0" /> {t("downloadPage.fileLabel")}: {p.filename}
                  </div>
                </dl>
                <a
                  href={p.url}
                  download
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-500"
                >
                  <Download className="h-4 w-4" />
                  {p.cta}
                </a>
              </div>
            );
          })}
        </div>

        <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-100 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          {t("downloadPage.howto")}
        </p>

        {/* 코드 서명 전이라 설치 시 뜨는 SmartScreen/미확인 개발자 경고 안내 */}
        <details className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
          <summary className="cursor-pointer font-semibold">{t("downloadPage.smartScreenTitle")}</summary>
          <p className="mt-2">{t("downloadPage.smartScreen")}</p>
        </details>

        {/* 상세 시스템 요구사항 표 */}
        <section className="mt-10">
          <h2 className="text-lg font-bold">{t("downloadPage.reqTitle")}</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold"> </th>
                  <th className="px-4 py-3 font-semibold">Windows</th>
                  <th className="px-4 py-3 font-semibold">macOS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { icon: Monitor, label: t("downloadPage.reqOs"), w: SYSTEM_REQUIREMENTS.windows.os, m: SYSTEM_REQUIREMENTS.mac.os },
                  { icon: Cpu, label: t("downloadPage.reqCpu"), w: SYSTEM_REQUIREMENTS.windows.cpu, m: SYSTEM_REQUIREMENTS.mac.cpu },
                  { icon: MemoryStick, label: t("downloadPage.reqRam"), w: SYSTEM_REQUIREMENTS.windows.ram, m: SYSTEM_REQUIREMENTS.mac.ram },
                  { icon: HardDrive, label: t("downloadPage.reqDisk"), w: SYSTEM_REQUIREMENTS.windows.disk, m: SYSTEM_REQUIREMENTS.mac.disk },
                ].map(({ icon: Icon, label, w, m }) => (
                  <tr key={label} className="bg-white dark:bg-slate-900">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                      <span className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-slate-400" />
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{w}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
