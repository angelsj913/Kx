"use client";

import { Play, Zap, Target, Waves } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";

export default function TechDemo() {
  const t = useLandingT();

  const features = [
    { icon: Zap, title: t("techdemo.feature1.title"), desc: t("techdemo.feature1.desc") },
    { icon: Target, title: t("techdemo.feature2.title"), desc: t("techdemo.feature2.desc") },
    { icon: Waves, title: t("techdemo.feature3.title"), desc: t("techdemo.feature3.desc") },
  ];

  return (
    <section id="potential" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t("techdemo.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base">
            {t("techdemo.subtitle")}
          </p>
        </div>

        <div id="prototype" className="mt-12 grid scroll-mt-24 gap-6 sm:grid-cols-2">
          {[t("techdemo.video1"), t("techdemo.video2")].map((label) => (
            <div
              key={label}
              className="flex aspect-video flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/10">
                <Play className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-slate-700">{label}</p>
              <p className="text-xs text-slate-400">{t("techdemo.videoPlaceholder")}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 hover:border-blue-400/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/30">
                <Icon className="h-4.5 w-4.5 text-white" />
              </div>
              <h3 className="mt-3.5 text-sm font-semibold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
