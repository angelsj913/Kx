"use client";

import { Eye, Ear, ListChecks } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";

export default function LectureAnalysis() {
  const t = useLandingT();

  const highlights = [
    { icon: Eye, label: t("lecture.highlight1") },
    { icon: Ear, label: t("lecture.highlight2") },
    { icon: ListChecks, label: t("lecture.highlight3") },
  ];

  return (
    <section id="prototype" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-center">
            <h2 className="mx-auto max-w-2xl text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
              {t("lecture.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base dark:text-slate-300">{t("lecture.subtitle")}</p>
          </div>

          <div className="mt-8 space-y-4 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
            <p>{t("lecture.body1")}</p>
            <p>{t("lecture.body2")}</p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {highlights.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] hover:border-blue-500/60 hover:bg-white hover:shadow-md hover:shadow-blue-600/10 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-800/60"
              >
                <Icon className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
