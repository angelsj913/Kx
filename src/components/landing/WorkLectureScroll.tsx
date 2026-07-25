"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Presentation, Table2, Eye, Play, Link2, FileText } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";
import {
  useScrollProgress,
  stickySceneIndex,
  sceneLocalProgress,
  trackTranslatePercent,
} from "@/lib/landingScroll";

const SCENE_COUNT = 3;

function MockPptSlides({ progress }: { progress: number }) {
  const activeSlide = Math.min(2, Math.floor(progress * 3));
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
            className={`aspect-[4/3] rounded-lg border p-2 transition-all ${
              i === activeSlide ? "border-blue-500 ring-2 ring-blue-500/30" : "border-slate-200 dark:border-slate-700"
            }`}
          >
            <div className={`mb-1 h-1.5 rounded ${i === activeSlide ? "w-full bg-blue-500" : "w-2/3 bg-slate-300 dark:bg-slate-600"}`} />
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

function MockExcelGrid({ progress }: { progress: number }) {
  const cols = ["A", "B", "C", "D"];
  const highlightRow = Math.min(3, Math.floor(progress * 4));
  const bars = [72, 48, 88, 56].map((h) => Math.round(h * (0.35 + progress * 0.65)));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Table2 className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Budget.xlsx</span>
        </div>
        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
          스크립트 {Math.round(progress * 100)}%
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-4 bg-slate-100 text-[9px] font-semibold text-slate-500 dark:bg-slate-800">
          {cols.map((c) => (
            <div key={c} className="border-r border-slate-200 px-2 py-1 last:border-r-0 dark:border-slate-700">
              {c}
            </div>
          ))}
        </div>
        {bars.map((h, ri) => (
          <div
            key={ri}
            className={`grid grid-cols-4 border-t border-slate-100 transition-colors dark:border-slate-800 ${
              ri === highlightRow ? "bg-blue-50 dark:bg-blue-950/40" : ""
            }`}
          >
            {cols.map((c, ci) => (
              <div key={c} className="border-r border-slate-100 px-2 py-2 last:border-r-0 dark:border-slate-800">
                {ci === 3 ? (
                  <div
                    className="rounded bg-blue-500/40 transition-all"
                    style={{ height: `${Math.max(8, h * 0.28)}px`, maxHeight: "2rem" }}
                  />
                ) : (
                  <div
                    className={`h-1.5 rounded ${ri === highlightRow ? "bg-blue-400" : "bg-slate-200 dark:bg-slate-700"}`}
                    style={{ width: `${60 + ri * 8}%` }}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** 실제 앱 강의 요약 UI를 닮은 목업 */
function MockLecturePanel({ progress }: { progress: number }) {
  const wave = [30, 55, 40, 70, 90, 60, 45, 75, 50, 85, 65, 40, 55, 80, 60, 35];
  const activeCount = Math.floor(progress * wave.length);
  const noteLines = [
    "학습 목표: 미적분 극한의 정의와 활용",
    "판서 핵심: lim x→0 (sin x)/x = 1",
    "음성 강조: 증명보다 직관으로 먼저 이해하기",
  ];
  const visibleNotes = Math.max(1, Math.ceil(progress * noteLines.length));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-900/60">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-blue-600" />
        <span className="truncate text-[11px] text-slate-500">youtube.com/watch?v=zeff-lecture-demo</span>
        <span className="ml-auto shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-semibold text-white">
          분석 중
        </span>
      </div>

      <div className="grid grid-cols-[1.1fr_0.9fr] gap-2">
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-800">
          <div className="absolute inset-3 rounded border border-dashed border-white/20 bg-white/5" />
          <Play className="relative z-10 h-7 w-7 text-white/90" fill="currentColor" />
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
            <div className="h-full bg-blue-500" style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[8px] text-white/90">판서</span>
        </div>
        <div className="flex flex-col rounded-lg border border-slate-200 p-2 dark:border-slate-700">
          <div className="mb-1 flex items-center gap-1 text-[9px] font-semibold text-slate-500">
            <FileText className="h-3 w-3" /> 한 장 노트
          </div>
          <ul className="space-y-1.5">
            {noteLines.slice(0, visibleNotes).map((line) => (
              <li key={line} className="rounded bg-slate-50 px-1.5 py-1 text-[9px] leading-snug text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex h-8 items-end gap-[2px]">
        {wave.map((h, i) => (
          <span
            key={i}
            className={`w-full rounded-full ${i < activeCount ? "bg-blue-500/80" : "bg-slate-200 dark:bg-slate-700"}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">비전(판서) + 음성 → 복습용 노트로 병합</p>
    </div>
  );
}

export default function WorkLectureScroll() {
  const t = useLandingT();
  const { sectionRef, p, reducedMotion } = useScrollProgress<HTMLElement>({ topOffset: 72 });
  const prevIdx = useRef(0);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const next = stickySceneIndex(p, SCENE_COUNT, 0.1, prevIdx.current);
    prevIdx.current = next;
    setActiveIdx(next);
  }, [p]);

  const trackX = trackTranslatePercent(p, SCENE_COUNT);

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
    <section ref={sectionRef} className="relative h-[420vh]">
      <div className="sticky top-0 flex min-h-[100svh] items-center py-16">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative">
            <div className="absolute bottom-4 left-3 top-4 w-px bg-slate-200 dark:bg-slate-700" />
            <div
              className="absolute left-3 top-4 w-px origin-top bg-blue-600 dark:bg-blue-400"
              style={{
                height: `${Math.min(100, (p / Math.max(0.001, (SCENE_COUNT - 1) / SCENE_COUNT)) * 100)}%`,
                maxHeight: "calc(100% - 2rem)",
              }}
            />
            <div className="space-y-8 pl-8">
              {officeItems.map((item, i) => {
                const isActive = i === activeIdx;
                return (
                  <div key={item.title} className={`transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-40"}`}>
                    <div className="flex items-center gap-3">
                      <span
                        className={`relative z-10 flex h-3 w-3 shrink-0 rounded-full border-2 ${
                          isActive
                            ? "border-blue-600 bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.2)]"
                            : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
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
              <div
                className="flex will-change-transform"
                style={{ transform: `translateX(${trackX}%)`, width: `${SCENE_COUNT * 100}%` }}
              >
                {[0, 1, 2].map((i) => {
                  const sceneP = sceneLocalProgress(p, SCENE_COUNT, i);
                  return (
                    <div key={i} className="shrink-0 pr-0" style={{ width: `${100 / SCENE_COUNT}%` }}>
                      {i === 0 && <MockPptSlides progress={sceneP} />}
                      {i === 1 && <MockExcelGrid progress={sceneP} />}
                      {i === 2 && <MockLecturePanel progress={sceneP} />}
                    </div>
                  );
                })}
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
