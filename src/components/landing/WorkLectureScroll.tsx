"use client";

import { motion } from "framer-motion";
import { Presentation, Table2, Eye, Play } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";
import { useScrollProgress, sceneIndex } from "@/lib/landingScroll";

const SCENE_COUNT = 3;

function MockPptSlides() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-700">
        <Presentation className="h-4 w-4 text-orange-500" />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Q3 Report.pptx</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["Cover", "Chart", "Summary"].map((label, i) => (
          <div
            key={label}
            className={`aspect-[4/3] rounded-lg border p-2 ${i === 0 ? "border-blue-500 ring-2 ring-blue-500/30" : "border-slate-200 dark:border-slate-700"}`}
          >
            <div className={`mb-1 h-1.5 rounded ${i === 0 ? "w-full bg-blue-500" : "w-2/3 bg-slate-300 dark:bg-slate-600"}`} />
            <div className="space-y-1">
              <div className="h-1 w-full rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-1 w-4/5 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
            <p className="mt-1 text-[8px] text-slate-400">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockExcelGrid() {
  const cols = ["A", "B", "C", "D"];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-700">
        <Table2 className="h-4 w-4 text-emerald-600" />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Budget.xlsx</span>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-4 bg-slate-100 text-[9px] font-semibold text-slate-500 dark:bg-slate-800">
          {cols.map((c) => (
            <div key={c} className="border-r border-slate-200 px-2 py-1 last:border-r-0 dark:border-slate-700">
              {c}
            </div>
          ))}
        </div>
        {[72, 48, 88, 56].map((h, ri) => (
          <div key={ri} className="grid grid-cols-4 border-t border-slate-100 dark:border-slate-800">
            {cols.map((c, ci) => (
              <div key={c} className="border-r border-slate-100 px-2 py-2 last:border-r-0 dark:border-slate-800">
                {ci === 3 ? (
                  <div className="h-8 rounded bg-blue-500/20" style={{ height: `${h}%`, maxHeight: "2rem" }} />
                ) : (
                  <div className="h-1.5 rounded bg-slate-200 dark:bg-slate-700" style={{ width: `${60 + ri * 8}%` }} />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MockLecturePanel({ progress }: { progress: number }) {
  const wave = [30, 55, 40, 70, 90, 60, 45, 75, 50, 85, 65, 40, 55, 80, 60, 35];
  const activeCount = Math.floor(progress * wave.length);
  return (
    <div className="space-y-3">
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-800">
        <Play className="h-8 w-8 text-white/90" fill="currentColor" />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      <div className="flex h-10 items-end gap-[2px]">
        {wave.map((h, i) => (
          <span
            key={i}
            className={`w-full rounded-full ${i < activeCount ? "bg-blue-500/80" : "bg-slate-200 dark:bg-slate-700"}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
        …판서와 음성을 함께 읽어 한 장의 노트로 정리합니다.
      </p>
    </div>
  );
}

const VISUALS = [MockPptSlides, MockExcelGrid] as const;

export default function WorkLectureScroll() {
  const t = useLandingT();
  const { sectionRef, p, reducedMotion } = useScrollProgress<HTMLElement>({ topOffset: 72 });

  const officeItems = [
    { title: t("office.ppt.title"), desc: t("office.ppt.desc"), detail: t("office.ppt.detail"), group: t("office.title") },
    { title: t("office.excel.title"), desc: t("office.excel.desc"), detail: t("office.excel.detail"), group: t("office.title") },
    {
      title: t("lecture.title"),
      desc: t("lecture.body1"),
      detail: t("lecture.body2"),
      group: t("lecture.title"),
    },
  ];

  const activeIdx = sceneIndex(p, SCENE_COUNT);
  const localP = SCENE_COUNT > 1 ? (p * SCENE_COUNT) % 1 : p;
  const trackX = -(activeIdx * 100);

  if (reducedMotion) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-6xl space-y-16 px-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{t("office.title")}</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {officeItems.slice(0, 2).map((item) => (
                <div key={item.title} className="landing-card rounded-2xl p-6">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div id="prototype" className="scroll-mt-24 landing-card rounded-3xl p-8">
            <h2 className="text-2xl font-bold">{t("lecture.title")}</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{t("lecture.subtitle")}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative h-[300vh]">
      <div className="sticky top-0 flex min-h-[100svh] items-center py-16">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative">
            <div className="absolute bottom-4 left-3 top-4 w-px bg-slate-200 dark:bg-slate-700" />
            <div
              className="absolute left-3 top-4 w-px origin-top bg-blue-600 transition-all duration-300 dark:bg-blue-400"
              style={{ height: `${((activeIdx + localP) / (SCENE_COUNT - 1)) * 100}%`, maxHeight: "calc(100% - 2rem)" }}
            />
            <div className="space-y-8 pl-8">
              {officeItems.map((item, i) => {
                const isActive = i === activeIdx;
                return (
                  <div key={item.title} className={`transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-40"}`}>
                    <div className="flex items-center gap-3">
                      <span
                        className={`relative z-10 flex h-3 w-3 shrink-0 rounded-full border-2 ${
                          isActive ? "border-blue-600 bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.2)]" : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
                        }`}
                      />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">{item.group}</p>
                    </div>
                    <h2 className={`mt-2 text-xl font-bold sm:text-2xl ${isActive ? "text-slate-900 dark:text-slate-50" : "text-slate-500"}`}>
                      {item.title}
                    </h2>
                    {isActive && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.desc}</p>
                        <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">{item.detail}</p>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="landing-card overflow-hidden rounded-2xl p-5 shadow-lg">
            <div className="overflow-hidden">
              <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(${trackX}%)`, width: `${SCENE_COUNT * 100}%` }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-full shrink-0 pr-0" style={{ width: `${100 / SCENE_COUNT}%` }}>
                    {i === 2 ? <MockLecturePanel progress={localP} /> : (() => { const V = VISUALS[i]!; return <V />; })()}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex gap-2 border-t border-slate-200/80 pt-4 dark:border-slate-700">
              {[Presentation, Table2, Eye].map((Icon, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    i === activeIdx ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
