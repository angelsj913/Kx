"use client";

import { motion } from "framer-motion";
import { Presentation, Table2, Eye, Link2 } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";
import { useReducedMotion } from "@/lib/useReducedMotion";

function MockPptSlides() {
  const activeSlide = 1;
  return (
    <div className="space-y-3">
      <div className="border-b border-slate-200 pb-2 dark:border-slate-700">
        <div className="grid grid-cols-14 gap-[3px]" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }} aria-hidden>
          {Array.from({ length: 42 }).map((_, i) => (
            <span
              key={i}
              className={`aspect-square rounded-[1px] ${
                i < 28 ? "bg-slate-800 dark:bg-slate-200" : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">Q3 Report · slide 2/3</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["Cover", "Chart", "Summary"].map((label, i) => (
          <div
            key={label}
            className={`aspect-[4/3] rounded-md border-2 p-1.5 ${
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

function MockExcelGrid() {
  const rows = ["매출", "비용", "이익", "성장"];
  const values = [128, 84, 44, 72];
  const highlightRow = 2;
  const spark = [80, 90, 100, 110, 95, 120];

  return (
    <div className="space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">Budget.xlsx</span>
        <span className="text-[9px] tabular-nums text-slate-500">100%</span>
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
              {spark.map((h, ci) => (
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

function MockLecturePanel() {
  const lines = [
    { t: "00:12", text: "학습 목표: 미적분 극한의 정의와 활용" },
    { t: "02:45", text: "판서 핵심: lim x→0 (sin x)/x = 1" },
    { t: "05:18", text: "음성 강조: 증명보다 직관으로 먼저 이해하기" },
    { t: "08:03", text: "예제: 좌극한·우극한·양쪽극한 비교" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-700">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        <span className="truncate font-mono text-[10px] text-slate-500">lecture · transcript</span>
      </div>
      <div className="relative pl-3">
        <div className="absolute bottom-1 left-[5px] top-1 w-px bg-slate-200 dark:bg-slate-700" />
        <ul className="space-y-2">
          {lines.map((line, i) => {
            const isActive = i === 1;
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
  const reducedMotion = useReducedMotion();

  const cards = [
    {
      id: "ppt",
      Icon: Presentation,
      title: t("office.ppt.title"),
      desc: t("office.ppt.desc"),
      detail: t("office.ppt.detail"),
      mock: <MockPptSlides />,
    },
    {
      id: "excel",
      Icon: Table2,
      title: t("office.excel.title"),
      desc: t("office.excel.desc"),
      detail: t("office.excel.detail"),
      mock: <MockExcelGrid />,
    },
    {
      id: "lecture",
      Icon: Eye,
      title: t("lecture.title"),
      desc: t("lecture.body1"),
      detail: t("lecture.body2"),
      mock: <MockLecturePanel />,
      anchor: "prototype" as const,
    },
  ];

  return (
    <section id="office" className="landing-section-rule scroll-mt-24 py-12 sm:py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <h2 className="landing-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            {t("office.title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
            {t("office.subtitle")}
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {cards.map(({ id, Icon, title, desc, detail, mock, anchor }, i) => (
            <motion.article
              key={id}
              id={anchor}
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.28, delay: reducedMotion ? 0 : i * 0.05, ease: [0.23, 1, 0.32, 1] }}
              className="landing-card flex scroll-mt-24 flex-col overflow-hidden rounded-2xl"
            >
              <div className="border-b border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                {mock}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--landing-accent-muted)] text-[var(--landing-accent)]">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="mt-3 text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3">{desc}</p>
                <p className="mt-2 text-sm text-[var(--landing-accent)] line-clamp-2">{detail}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
