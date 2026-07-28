"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Presentation, Table2, Eye, Link2 } from "lucide-react";
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
  const dotCols = 14;
  const dotRows = 3;
  const filledDots = Math.floor(progress * dotCols * dotRows);
  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-3 dark:border-slate-700">
        <div
          className="grid gap-[3px]"
          style={{ gridTemplateColumns: `repeat(${dotCols}, minmax(0, 1fr))` }}
          aria-hidden
        >
          {Array.from({ length: dotCols * dotRows }).map((_, i) => (
            <span
              key={i}
              className={`aspect-square rounded-[1px] ${
                i < filledDots ? "bg-slate-800 dark:bg-slate-200" : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">Q3 Report · slide {activeSlide + 1}/3</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["Cover", "Chart", "Summary"].map((label, i) => (
          <div
            key={label}
            className={`aspect-[4/3] rounded-md border-2 p-1.5 transition-all ${
              i === activeSlide
                ? "border-slate-900 dark:border-slate-100"
                : "border-slate-200 opacity-60 dark:border-slate-700"
            }`}
          >
            <div className={`mb-1 h-1 rounded-sm ${i === activeSlide ? "w-full bg-slate-800 dark:bg-slate-200" : "w-2/3 bg-slate-300 dark:bg-slate-600"}`} />
            <div className="space-y-0.5">
              <div className="h-0.5 w-full rounded-sm bg-slate-200 dark:bg-slate-700" />
              <div className="h-0.5 w-4/5 rounded-sm bg-slate-100 dark:bg-slate-800" />
            </div>
            <p className="mt-1 font-mono text-[7px] text-slate-400">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockExcelGrid({ progress }: { progress: number }) {
  const rows = ["매출", "비용", "이익", "성장"];
  const values = [128, 84, 44, 72];
  const highlightRow = Math.min(3, Math.floor(progress * 4));
  const spark = values.map((v) => Math.round(v * (0.4 + progress * 0.6)));

  return (
    <div className="space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">Budget.xlsx</span>
        <span className="text-[9px] tabular-nums text-slate-500">{Math.round(progress * 100)}%</span>
      </div>
      <div className="overflow-hidden rounded border border-slate-300 dark:border-slate-600">
        <div className="grid grid-cols-[1.2fr_0.6fr_1fr] border-b border-slate-300 bg-slate-100 text-[8px] font-semibold uppercase text-slate-500 dark:border-slate-600 dark:bg-slate-800">
          <div className="px-2 py-1">항목</div>
          <div className="border-l border-slate-300 px-2 py-1 dark:border-slate-600">값</div>
          <div className="border-l border-slate-300 px-2 py-1 dark:border-slate-600">추이</div>
        </div>
        {rows.map((label, ri) => (
          <div
            key={label}
            className={`grid grid-cols-[1.2fr_0.6fr_1fr] border-t border-slate-200 text-[9px] dark:border-slate-700 ${
              ri === highlightRow ? "bg-slate-100 dark:bg-slate-800/80" : ""
            }`}
          >
            <div className="px-2 py-2 text-slate-700 dark:text-slate-300">{label}</div>
            <div className="border-l border-slate-200 px-2 py-2 tabular-nums text-slate-600 dark:border-slate-700 dark:text-slate-400">
              {values[ri]}
            </div>
            <div className="flex items-center gap-[2px] border-l border-slate-200 px-2 py-1.5 dark:border-slate-700">
              {spark.slice(0, 6).map((h, ci) => (
                <span
                  key={ci}
                  className={`w-full rounded-sm ${ri === highlightRow ? "bg-slate-800 dark:bg-slate-200" : "bg-slate-300 dark:bg-slate-600"}`}
                  style={{ height: `${Math.max(4, h * 0.22)}px` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 타임스탬프 열 중심 — FeatureShowcase 강의(파형)와 다른 레이아웃 */
function MockLecturePanel({ progress }: { progress: number }) {
  const lines = [
    { t: "00:12", text: "학습 목표: 미적분 극한의 정의와 활용" },
    { t: "02:45", text: "판서 핵심: lim x→0 (sin x)/x = 1" },
    { t: "05:18", text: "음성 강조: 증명보다 직관으로 먼저 이해하기" },
    { t: "08:03", text: "예제: 좌극한·우극한·양쪽극한 비교" },
  ];
  const visible = Math.max(1, Math.ceil(progress * lines.length));
  const activeLine = Math.min(lines.length - 1, Math.floor(progress * lines.length));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-700">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        <span className="truncate font-mono text-[10px] text-slate-500">lecture · transcript</span>
      </div>
      <div className="relative pl-3">
        <div className="absolute bottom-1 left-[5px] top-1 w-px bg-slate-200 dark:bg-slate-700" />
        <ul className="space-y-2">
          {lines.slice(0, visible).map((line, i) => {
            const isActive = i === activeLine;
            return (
              <li key={line.t} className="relative flex gap-2">
                <span
                  className={`relative z-10 mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 ${
                    isActive
                      ? "border-slate-900 bg-slate-900 dark:border-slate-100 dark:bg-slate-100"
                      : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
                  }`}
                />
                <div className={`min-w-0 flex-1 rounded-md border px-2 py-1.5 ${isActive ? "border-slate-400 bg-slate-50 dark:border-slate-500 dark:bg-slate-800/60" : "border-slate-200 dark:border-slate-700"}`}>
                  <span className="font-mono text-[8px] tabular-nums text-slate-400">{line.t}</span>
                  <p className="mt-0.5 text-[9px] leading-snug text-slate-600 dark:text-slate-300">{line.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="font-mono text-[9px] text-slate-500 dark:text-slate-400">vision + audio → timestamped notes</p>
    </div>
  );
}

export default function WorkLectureScroll() {
  const t = useLandingT();
  const { sectionRef, p, reducedMotion, mounted } = useScrollProgress<HTMLElement>({ topOffset: 72 });
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
                  // 비활성도 읽히게 둔다. opacity-40 + text-slate-500이 이중으로 걸려
                  // 배경에 묻혔다 — 강조는 투명도가 아니라 색·굵기로 준다.
                  <div key={item.title} className={`transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-70"}`}>
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
                    <h2 className={`mt-2 text-xl font-bold sm:text-2xl ${isActive ? "text-slate-900 dark:text-slate-50" : "text-slate-600 dark:text-slate-400"}`}>
                      {item.title}
                    </h2>
                    {isActive && (
                      <motion.div initial={mounted ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }}>
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
