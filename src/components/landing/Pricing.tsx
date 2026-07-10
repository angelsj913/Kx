"use client";

import { Check } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";

export default function Pricing() {
  const t = useLandingT();

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t("pricing.title")}
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">{t("pricing.subtitle")}</p>
        </div>

        <div className="mt-12 grid items-end gap-6 lg:grid-cols-3">
          {/* Free */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">{t("pricing.free.name")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("pricing.free.desc")}</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900">{t("pricing.free.price")}</span>
              <span className="text-sm text-slate-500">{t("pricing.free.period")}</span>
            </div>
            <button
              type="button"
              className="mt-8 w-full rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-colors duration-300 hover:bg-blue-600 hover:text-white"
            >
              {t("pricing.free.cta")}
            </button>
          </div>

          {/* Pro */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">{t("pricing.pro.name")}</h3>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-600">
              <Check className="h-3.5 w-3.5" />
              {t("pricing.pro.badge")}
            </span>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{t("pricing.pro.desc")}</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900">{t("pricing.pro.price")}</span>
              <span className="text-sm text-slate-500">{t("pricing.pro.period")}</span>
            </div>
            <button
              type="button"
              className="mt-8 w-full rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-colors duration-300 hover:bg-blue-600 hover:text-white"
            >
              {t("pricing.pro.cta")}
            </button>
          </div>

          {/* Professional (highlighted) */}
          <div className="rounded-3xl border-2 border-blue-600 bg-white p-8 pb-10 pt-9 shadow-xl shadow-blue-600/10 lg:-mt-4">
            <span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
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
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {t("pricing.professional.desc")}
            </p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900">
                {t("pricing.professional.price")}
              </span>
              <span className="text-sm text-slate-500">{t("pricing.professional.period")}</span>
            </div>
            <button
              type="button"
              className="mt-8 w-full rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-colors duration-300 hover:bg-blue-500"
            >
              {t("pricing.professional.cta")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
