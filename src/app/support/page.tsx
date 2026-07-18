"use client";

import { ChevronDown } from "lucide-react";
import { useLandingT, type LandingDictKey } from "@/lib/landingI18n";
import SupportShell from "@/components/support/SupportShell";

const FAQ_KEYS: [LandingDictKey, LandingDictKey][] = [
  ["support.faq.q1", "support.faq.a1"],
  ["support.faq.q2", "support.faq.a2"],
  ["support.faq.q3", "support.faq.a3"],
  ["support.faq.q4", "support.faq.a4"],
  ["support.faq.q5", "support.faq.a5"],
  ["support.faq.q6", "support.faq.a6"],
  ["support.faq.q7", "support.faq.a7"],
  ["support.faq.q8", "support.faq.a8"],
  ["support.faq.q9", "support.faq.a9"],
];

export default function SupportFaqPage() {
  const t = useLandingT();

  return (
    <SupportShell active="faq">
      <h2 className="mb-5 text-lg font-bold sm:text-xl">{t("support.tab.faq")}</h2>
      <div className="space-y-3">
        {FAQ_KEYS.map(([qKey, aKey]) => (
          <details
            key={qKey}
            className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors open:border-blue-400/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:open:border-blue-500/60"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-slate-900 dark:text-slate-100 [&::-webkit-details-marker]:hidden">
              {t(qKey)}
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t(aKey)}</p>
          </details>
        ))}
      </div>
    </SupportShell>
  );
}
