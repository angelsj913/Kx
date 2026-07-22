"use client";

import { Gauge, Sparkles, Library } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";

const PILL_ICONS = [Gauge, Sparkles, Library];

export default function PricingLead() {
  const t = useLandingT();
  const pills = [
    { titleKey: "pricing.lead.pill1.title" as const, descKey: "pricing.lead.pill1.desc" as const },
    { titleKey: "pricing.lead.pill2.title" as const, descKey: "pricing.lead.pill2.desc" as const },
    { titleKey: "pricing.lead.pill3.title" as const, descKey: "pricing.lead.pill3.desc" as const },
  ];

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
          {t("pricing.lead.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
          {t("pricing.lead.subtitle")}
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {pills.map(({ titleKey, descKey }, i) => {
            const Icon = PILL_ICONS[i]!;
            return (
              <div key={titleKey} className="landing-card rounded-2xl p-5 text-left">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-50">{t(titleKey)}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{t(descKey)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
