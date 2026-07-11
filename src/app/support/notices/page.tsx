"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";
import { NOTICES } from "@/lib/notices";
import SupportShell from "@/components/support/SupportShell";

export default function SupportNoticesPage() {
  const t = useLandingT();

  return (
    <SupportShell active="notices">
      <h1 className="mb-5 text-xl font-bold sm:text-2xl">{t("support.tab.announcements")}</h1>
      <ul className="space-y-3">
        {NOTICES.map((n) => (
          <li key={n.id}>
            <Link
              href={`/support/notices/${n.id}`}
              className="group flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-blue-400/60 hover:shadow-md hover:shadow-blue-600/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/60"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{n.period}</p>
                <p className="mt-1 text-base font-bold text-slate-900 dark:text-slate-50">{n.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{n.summary}</p>
              </div>
              <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-blue-500 dark:text-slate-600" />
            </Link>
          </li>
        ))}
      </ul>
    </SupportShell>
  );
}
