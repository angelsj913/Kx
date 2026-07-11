"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Building2, TrendingUp, FlaskConical, Check } from "lucide-react";
import { useLandingT, type LandingDictKey } from "@/lib/landingI18n";
import BackButton from "@/components/ui/BackButton";
import ThemeToggle from "@/components/ThemeToggle";

export type CompanyTab = "about" | "vision" | "prototype";

const PROTOTYPE_ITEMS: LandingDictKey[] = [
  "company.prototype.item1",
  "company.prototype.item2",
  "company.prototype.item3",
  "company.prototype.item4",
];

const TABS: { key: CompanyTab; href: string; icon: typeof Building2; labelKey: LandingDictKey }[] = [
  { key: "about", href: "/about", icon: Building2, labelKey: "nav.about" },
  { key: "vision", href: "/vision", icon: TrendingUp, labelKey: "nav.potential" },
  { key: "prototype", href: "/prototype", icon: FlaskConical, labelKey: "nav.prototype" },
];

export default function CompanyPageContent({ tab }: { tab: CompanyTab }) {
  const t = useLandingT();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3.5">
          <BackButton fallbackHref="/" />
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-zeff.png" alt="ZEFF AI" width={24} height={24} className="rounded-md" />
            <span className="text-sm font-bold tracking-tight">ZEFF AI</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <nav className="mb-8 flex gap-1 border-b border-slate-200 dark:border-slate-800">
          {TABS.map(({ key, href, icon: Icon, labelKey }) => {
            const active = key === tab;
            return (
              <Link
                key={key}
                href={href}
                className={`flex items-center gap-1.5 border-b-2 px-3.5 pb-3 text-sm font-medium transition-colors duration-300 ${
                  active
                    ? "border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>

        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {tab === "about" && (
            <article className="space-y-5">
              <h1 className="text-2xl font-bold sm:text-3xl">{t("company.about.title")}</h1>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">{t("company.about.body1")}</p>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">{t("company.about.body2")}</p>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">{t("company.about.body3")}</p>
            </article>
          )}
          {tab === "vision" && (
            <article className="space-y-5">
              <h1 className="text-2xl font-bold sm:text-3xl">{t("company.vision.title")}</h1>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">{t("company.vision.body1")}</p>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">{t("company.vision.body2")}</p>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">{t("company.vision.body3")}</p>
            </article>
          )}
          {tab === "prototype" && (
            <article className="space-y-5">
              <h1 className="text-2xl font-bold sm:text-3xl">{t("company.prototype.title")}</h1>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">{t("company.prototype.body1")}</p>
              <ul className="space-y-3">
                {PROTOTYPE_ITEMS.map((key) => (
                  <li key={key} className="flex items-start gap-2.5 leading-relaxed text-slate-600 dark:text-slate-300">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-blue-500" />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </article>
          )}
        </motion.div>
      </div>
    </div>
  );
}
