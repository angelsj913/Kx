"use client";

import { Play, Zap, Target, Waves } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";

export default function WorkspaceIntro() {
  const t = useLandingT();

  const features = [
    { icon: Zap, title: t("workspace.feature1.title"), desc: t("workspace.feature1.desc"), detail: t("workspace.feature1.detail") },
    { icon: Target, title: t("workspace.feature2.title"), desc: t("workspace.feature2.desc"), detail: t("workspace.feature2.detail") },
    { icon: Waves, title: t("workspace.feature3.title"), desc: t("workspace.feature3.desc"), detail: t("workspace.feature3.detail") },
  ];

  return (
    <section id="potential" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="mx-auto max-w-2xl break-keep text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            {t("workspace.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base dark:text-slate-300">
            {t("workspace.subtitle")}
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {[t("workspace.video1"), t("workspace.video2")].map((label) => (
            <div
              key={label}
              className="flex aspect-video flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/10">
                <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{t("workspace.videoPlaceholder")}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, desc, detail }) => (
            <div
              key={title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.03] hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-600/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/60"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/30">
                <Icon className="h-4.5 w-4.5 text-white" />
              </div>
              <h3 className="mt-3.5 text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{desc}</p>
              <div className="grid grid-rows-[0fr] transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:grid-rows-[1fr]">
                <div className="overflow-hidden">
                  <p className="mt-3 text-sm leading-relaxed text-blue-600 dark:text-blue-400">{detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
