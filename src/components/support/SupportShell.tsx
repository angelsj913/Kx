"use client";

import Link from "next/link";
import Image from "next/image";
import { HelpCircle, Megaphone, Mail, ScrollText, Inbox, LifeBuoy } from "lucide-react";
import { useLandingT, type LandingDictKey } from "@/lib/landingI18n";
import BackButton from "@/components/ui/BackButton";
import ThemeToggle from "@/components/ThemeToggle";

export type SupportSection = "faq" | "notices" | "releases" | "inquiry" | "history" | "legal";

interface NavItem {
  key: SupportSection;
  href: string;
  icon: typeof HelpCircle;
  labelKey: LandingDictKey;
  indent?: boolean;
}

const NAV: NavItem[] = [
  { key: "faq", href: "/support", icon: HelpCircle, labelKey: "support.tab.faq" },
  { key: "notices", href: "/support/notices", icon: Megaphone, labelKey: "support.tab.announcements" },
  { key: "inquiry", href: "/support/inquiry", icon: Mail, labelKey: "support.tab.inquiry" },
  { key: "history", href: "/support/inquiry/history", icon: Inbox, labelKey: "support.nav.history", indent: true },
  { key: "legal", href: "/support/legal", icon: ScrollText, labelKey: "support.tab.legal" },
];

export default function SupportShell({
  active,
  children,
}: {
  active: SupportSection;
  children: React.ReactNode;
}) {
  const t = useLandingT();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {/* 헤더 */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <BackButton fallbackHref="/" forceFallback />
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-zeff.png" alt="ZEFF AI" width={24} height={24} className="rounded-md dark:hidden" />
            <Image src="/logo-zeff-dark.png" alt="ZEFF AI" width={24} height={24} className="hidden rounded-md dark:block" />
            <span className="text-sm font-bold tracking-tight">{t("support.title")}</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* 히어로 배너 */}
      <div className="border-b border-slate-200/70 bg-gradient-to-b from-blue-50/60 to-transparent dark:border-slate-800/70 dark:from-blue-950/20">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-7 sm:px-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
            <LifeBuoy className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold sm:text-xl">{t("support.title")}</h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t("support.hero.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row">
        {/* 사이드바 (모바일: 가로 스크롤) */}
        <nav className="-mx-1 flex shrink-0 flex-row gap-1 overflow-x-auto px-1 pb-1 md:mx-0 md:w-56 md:flex-col md:overflow-visible md:pb-0">
          {NAV.map(({ key, href, icon: Icon, labelKey, indent }) => {
            const isActive = key === active;
            return (
              <Link
                key={key}
                href={href}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  indent ? "md:ml-3" : ""
                } ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25 dark:bg-blue-600"
                    : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>

        {/* 콘텐츠 — 각 페이지가 자체 카드를 slate-100 배경 위에 올린다(대비 확보) */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
