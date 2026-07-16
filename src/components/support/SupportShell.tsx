"use client";

import Link from "next/link";
import Image from "next/image";
import { HelpCircle, Megaphone, Archive, Mail, ScrollText, Inbox } from "lucide-react";
import { useLandingT, type LandingDictKey } from "@/lib/landingI18n";
import BackButton from "@/components/ui/BackButton";
import ThemeToggle from "@/components/ThemeToggle";

export type SupportSection = "faq" | "notices" | "releases" | "inquiry" | "history" | "legal";

interface NavItem {
  key: SupportSection;
  href: string;
  icon: typeof HelpCircle;
  labelKey: LandingDictKey;
  newTab?: boolean;
  indent?: boolean;
}

const NAV: NavItem[] = [
  { key: "faq", href: "/support", icon: HelpCircle, labelKey: "support.tab.faq" },
  { key: "notices", href: "/support/notices", icon: Megaphone, labelKey: "support.tab.announcements" },
  { key: "releases", href: "/support/releases", icon: Archive, labelKey: "support.tab.legacy" },
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
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <BackButton fallbackHref="/" />
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-zeff.png" alt="ZEFF AI" width={24} height={24} className="rounded-md dark:hidden" />
            <Image src="/logo-zeff-dark.png" alt="ZEFF AI" width={24} height={24} className="hidden rounded-md dark:block" />
            <span className="text-sm font-bold tracking-tight">{t("support.title")}</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row">
        <nav className="flex shrink-0 flex-row flex-wrap gap-1 md:w-56 md:flex-col">
          {NAV.map(({ key, href, icon: Icon, labelKey, newTab, indent }) => {
            const isActive = key === active;
            return (
              <Link
                key={key}
                href={href}
                {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-300 ${
                  indent ? "md:ml-3" : ""
                } ${
                  isActive
                    ? "bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
