"use client";

import { Gauge, Sparkles, Library } from "lucide-react";
import { motion } from "framer-motion";
import { useLandingT } from "@/lib/landingI18n";
import { useReducedMotion } from "@/lib/useReducedMotion";

const PILL_ICONS = [Gauge, Sparkles, Library];

export default function PricingLead() {
  const t = useLandingT();
  const reducedMotion = useReducedMotion();
  const pills = [
    { titleKey: "pricing.lead.pill1.title" as const, descKey: "pricing.lead.pill1.desc" as const },
    { titleKey: "pricing.lead.pill2.title" as const, descKey: "pricing.lead.pill2.desc" as const },
    { titleKey: "pricing.lead.pill3.title" as const, descKey: "pricing.lead.pill3.desc" as const },
  ];

  return (
    <section className="landing-section-rule py-10 sm:py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            {t("pricing.lead.title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
            {t("pricing.lead.subtitle")}
          </p>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {pills.map(({ titleKey, descKey }, i) => {
            const Icon = PILL_ICONS[i]!;
            return (
              <motion.div
                key={titleKey}
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.28, delay: reducedMotion ? 0 : i * 0.07, ease: [0.23, 1, 0.32, 1] }}
                className="landing-card rounded-2xl p-5 text-left"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-50">{t(titleKey)}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{t(descKey)}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
