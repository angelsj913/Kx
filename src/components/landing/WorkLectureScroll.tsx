"use client";

import { motion } from "framer-motion";
import { Presentation, Table2, FileText, Eye, Ear, ListChecks } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";
import { useScrollProgress, sceneIndex } from "@/lib/landingScroll";

const OFFICE_ICONS = [Presentation, Table2, FileText];
const LECTURE_ICONS = [Eye, Ear, ListChecks];

export default function WorkLectureScroll() {
  const t = useLandingT();
  const { sectionRef, p, reducedMotion } = useScrollProgress<HTMLElement>({ topOffset: 72 });

  const officeItems = [
    { title: t("office.ppt.title"), desc: t("office.ppt.desc"), detail: t("office.ppt.detail") },
    { title: t("office.excel.title"), desc: t("office.excel.desc"), detail: t("office.excel.detail") },
    { title: t("office.word.title"), desc: t("office.word.desc"), detail: t("office.word.detail") },
  ];
  const lectureHighlights = [
    { label: t("lecture.highlight1") },
    { label: t("lecture.highlight2") },
    { label: t("lecture.highlight3") },
  ];

  const scenes = [
    {
      eyebrow: t("office.title"),
      title: officeItems[0]!.title,
      body: officeItems[0]!.desc,
      detail: officeItems[0]!.detail,
      type: "office" as const,
      idx: 0,
    },
    {
      eyebrow: t("office.title"),
      title: officeItems[1]!.title,
      body: officeItems[1]!.desc,
      detail: officeItems[1]!.detail,
      type: "office" as const,
      idx: 1,
    },
    {
      eyebrow: t("lecture.title"),
      title: t("lecture.title"),
      body: t("lecture.body1"),
      detail: t("lecture.body2"),
      type: "lecture" as const,
      idx: 0,
    },
  ];

  const active = scenes[sceneIndex(p, scenes.length)]!;

  if (reducedMotion) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-6xl space-y-16 px-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{t("office.title")}</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {officeItems.map((item, i) => {
                const Icon = OFFICE_ICONS[i]!;
                return (
                  <div key={item.title} className="landing-card rounded-2xl p-6">
                    <Icon className="h-5 w-5 text-blue-600" />
                    <h3 className="mt-3 font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div id="prototype" className="scroll-mt-24 landing-card rounded-3xl p-8 sm:p-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{t("lecture.title")}</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{t("lecture.subtitle")}</p>
            <p className="mt-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t("lecture.body1")}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative h-[280vh]">
      <div className="sticky top-0 flex min-h-[100svh] items-center py-20">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 lg:grid-cols-2">
          <motion.div key={active.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
              {active.eyebrow}
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
              {active.title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">{active.body}</p>
            <p className="mt-3 text-sm text-blue-600 dark:text-blue-400">{active.detail}</p>
            <div className="mt-6 flex gap-2" aria-hidden>
              {scenes.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === sceneIndex(p, scenes.length) ? "w-8 bg-blue-600" : "w-3 bg-slate-300 dark:bg-slate-700"
                  }`}
                />
              ))}
            </div>
          </motion.div>

          <div className="landing-card rounded-2xl p-6 shadow-lg">
            {active.type === "office" ? (
              <div>
                {(() => {
                  const Icon = OFFICE_ICONS[active.idx]!;
                  const item = officeItems[active.idx]!;
                  return (
                    <>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.detail}</p>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-4">
                {lectureHighlights.map(({ label }, i) => {
                  const Icon = LECTURE_ICONS[i]!;
                  return (
                    <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
                      <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
