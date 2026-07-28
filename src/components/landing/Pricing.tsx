"use client";

import { Check } from "lucide-react";
import { useLandingT, type LandingDictKey } from "@/lib/landingI18n";

// 결제 개시 전에는 유료 CTA 가 503 으로 끝나는 막다른 길이다. env 를 켜면 그대로 살아난다.
const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "1";

const CTA_CLASS =
  "mt-6 block w-full rounded-2xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-900 shadow-none transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:border-transparent group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-600/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

function PlanCta({ href, label, comingSoon }: { href: string; label: string; comingSoon: string }) {
  if (!PAYMENTS_ENABLED) {
    return (
      <button
        type="button"
        disabled
        className="mt-6 w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-6 py-3 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
      >
        {comingSoon}
      </button>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={CTA_CLASS}>
      {label}
    </a>
  );
}

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

  return (
    <section
      id="pricing"
      className="relative scroll-mt-24 overflow-hidden pb-28 pt-20"
    >
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            {t("pricing.title")}
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-300">{t("pricing.subtitle")}</p>
          <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">{t("pricing.billingNote")}</p>
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

          {/* Pro */}
          <div className="group rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-sm transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-blue-600 hover:shadow-xl hover:shadow-blue-600/10 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t("pricing.pro.name")}</h3>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-600">
              <Check className="h-3.5 w-3.5" />
              {t("pricing.pro.badge")}
            </span>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t("pricing.pro.desc")}</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">{t("pricing.pro.price")}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{t("pricing.pro.period")}</span>
            </div>
            <PlanCta href="/checkout?plan=pro" label={t("pricing.pro.cta")} comingSoon={t("pricing.comingSoon")} />
            <ul className="mt-6 space-y-2.5 border-t border-slate-100 pt-6 dark:border-slate-800">
              {PRO_BULLETS.map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          {/* Professional */}
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
              <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">{t("pricing.professional.price")}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{t("pricing.professional.period")}</span>
            </div>
            <PlanCta
              href="/checkout?plan=professional"
              label={t("pricing.professional.cta")}
              comingSoon={t("pricing.comingSoon")}
            />
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
