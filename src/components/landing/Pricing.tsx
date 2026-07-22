"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useLandingT, useLandingLanguage, type LandingDictKey } from "@/lib/landingI18n";
import { PLANS } from "@/lib/plans";
import type { LandingLanguage } from "@/lib/landingI18n";

// 월/연 토글 라벨 — 앱 사전을 늘리지 않도록 로컬 카피(+en 폴백).
const BILLING: Partial<Record<LandingLanguage, { monthly: string; annual: string; save: string; perYear: string }>> & {
  en: { monthly: string; annual: string; save: string; perYear: string };
} = {
  ko: { monthly: "월간", annual: "연간", save: "2개월 무료", perYear: "/년" },
  en: { monthly: "Monthly", annual: "Annual", save: "2 months free", perYear: "/yr" },
  ja: { monthly: "月額", annual: "年額", save: "2か月無料", perYear: "/年" },
  zh: { monthly: "按月", annual: "按年", save: "省2个月", perYear: "/年" },
  ru: { monthly: "Помесячно", annual: "Ежегодно", save: "2 месяца бесплатно", perYear: "/год" },
  de: { monthly: "Monatlich", annual: "Jährlich", save: "2 Monate gratis", perYear: "/Jahr" },
  fr: { monthly: "Mensuel", annual: "Annuel", save: "2 mois offerts", perYear: "/an" },
  es: { monthly: "Mensual", annual: "Anual", save: "2 meses gratis", perYear: "/año" },
};

const FREE_BULLETS: LandingDictKey[] = [
  "pricing.free.bullet1",
  "pricing.free.bullet2",
  "pricing.free.bullet3",
  "pricing.free.bullet4",
  "pricing.free.bullet5",
  "pricing.free.bullet6",
];

const PRO_BULLETS: LandingDictKey[] = [
  "pricing.pro.bullet1",
  "pricing.pro.bullet2",
  "pricing.pro.bullet3",
  "pricing.pro.bullet4",
  "pricing.pro.bullet5",
  "pricing.pro.bullet6",
  "pricing.pro.bullet7",
];

const PROFESSIONAL_BULLETS: LandingDictKey[] = [
  "pricing.professional.bullet1",
  "pricing.professional.bullet2",
  "pricing.professional.bullet3",
  "pricing.professional.bullet4",
  "pricing.professional.bullet5",
  "pricing.professional.bullet6",
  "pricing.professional.bullet7",
];

export default function Pricing() {
  const t = useLandingT();
  const { language } = useLandingLanguage();
  const b = BILLING[language] ?? BILLING.en;
  const [annual, setAnnual] = useState(false);
  const proHref = `/checkout?plan=pro${annual ? "&interval=year" : ""}`;
  const professionalHref = `/checkout?plan=professional${annual ? "&interval=year" : ""}`;

  return (
    <section id="pricing" className="relative scroll-mt-24 pb-20 pt-8">
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            {t("pricing.title")}
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-300">{t("pricing.subtitle")}</p>

          {/* 월/연 결제 토글 — 연간은 2개월 무료 */}
          <div className="mt-7 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                !annual
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              {b.monthly}
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                annual
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              {b.annual}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  annual ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                }`}
              >
                {b.save}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-12 grid items-end gap-6 lg:grid-cols-3">
          {/* Free */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t("pricing.free.name")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t("pricing.free.desc")}</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">{t("pricing.free.price")}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{t("pricing.free.period")}</span>
            </div>
            <a
              href="/login?callbackUrl=/app"
              className="mt-6 block w-full rounded-2xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-900 transition-colors duration-400 hover:bg-blue-600 hover:text-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {t("pricing.free.cta")}
            </a>
            <ul className="mt-6 space-y-2.5 border-t border-slate-100 pt-6 dark:border-slate-800">
              {FREE_BULLETS.map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro (highlighted only on hover, same treatment as Professional) */}
          <div className="group rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-sm transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-blue-600 hover:shadow-xl hover:shadow-blue-600/10 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t("pricing.pro.name")}</h3>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-600">
              <Check className="h-3.5 w-3.5" />
              {t("pricing.pro.badge")}
            </span>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t("pricing.pro.desc")}</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                {annual ? PLANS.pro.annualPriceLabel : t("pricing.pro.price")}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {annual ? b.perYear : t("pricing.pro.period")}
              </span>
            </div>
            <a
              href={proHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block w-full rounded-2xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-900 shadow-none transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:border-transparent group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-600/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {t("pricing.pro.cta")}
            </a>
            <ul className="mt-6 space-y-2.5 border-t border-slate-100 pt-6 dark:border-slate-800">
              {PRO_BULLETS.map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          {/* Professional (highlighted only on hover) */}
          <div className="group rounded-3xl border-2 border-slate-200 bg-white p-8 pb-10 pt-9 shadow-xl shadow-slate-900/5 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-blue-600 hover:shadow-blue-600/10 lg:-mt-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition-colors duration-400 group-hover:bg-blue-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-200">
              {t("pricing.professional.name")}
            </span>
            <div className="mt-3 flex flex-col gap-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                <Check className="h-3.5 w-3.5" />
                {t("pricing.professional.badge1")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                <Check className="h-3.5 w-3.5" />
                {t("pricing.professional.badge2")}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {t("pricing.professional.desc")}
            </p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                {annual ? PLANS.professional.annualPriceLabel : t("pricing.professional.price")}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {annual ? b.perYear : t("pricing.professional.period")}
              </span>
            </div>
            <a
              href={professionalHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block w-full rounded-2xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-900 shadow-none transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:border-transparent group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-600/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {t("pricing.professional.cta")}
            </a>
            <ul className="mt-6 space-y-2.5 border-t border-slate-100 pt-6 dark:border-slate-800">
              {PROFESSIONAL_BULLETS.map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
