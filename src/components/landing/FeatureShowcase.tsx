"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Presentation, Table2, MessagesSquare, FileText } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";
import { useReducedMotion } from "@/lib/useReducedMotion";

function TextLine({ w, tone = "base" }: { w: string; tone?: "base" | "faint" | "accent" }) {
  const bg =
    tone === "accent"
      ? "bg-blue-200/80 dark:bg-blue-500/30"
      : tone === "faint"
        ? "bg-slate-100 dark:bg-slate-800"
        : "bg-slate-200 dark:bg-slate-700/80";
  return <div className={`h-1.5 rounded-full ${bg}`} style={{ width: w }} />;
}

function MockDocs({ slideIndex = 1 }: { slideIndex?: number }) {
  const tabs = [
    { id: "docx", label: "DOCX", Icon: FileText },
    { id: "pptx", label: "PPTX", Icon: Presentation },
    { id: "xlsx", label: "XLSX", Icon: Table2 },
  ] as const;
  const activeTab = slideIndex % 3;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {tabs.map(({ id, label, Icon }, i) => (
          <span
            key={id}
            className={`flex flex-1 items-center justify-center gap-1 px-2 py-2 text-[9px] font-semibold ${
              i === activeTab
                ? "border-b-2 border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100"
                : "text-slate-400"
            }`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </span>
        ))}
      </div>
      <div className="p-3">
        {activeTab === 0 && (
          <div className="space-y-2">
            <TextLine w="65%" />
            <TextLine w="100%" tone="faint" />
            <TextLine w="88%" tone="faint" />
            <div className="mt-2 overflow-hidden rounded border border-slate-200 dark:border-slate-700">
              {[0, 1].map((r) => (
                <div key={r} className="flex divide-x divide-slate-200 dark:divide-slate-700">
                  {[0, 1, 2].map((c) => (
                    <div
                      key={c}
                      className={`h-4 flex-1 ${r === 0 ? "bg-slate-100 dark:bg-slate-800" : "bg-white dark:bg-slate-900"}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 1 && (
          <div className="space-y-2">
            <TextLine w="50%" />
            <div className="flex h-14 items-end gap-1.5 pt-1">
              {[40, 65, 50, 85, 55].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-slate-700 dark:bg-slate-300" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        )}
        {activeTab === 2 && (
          <div className="space-y-1 font-mono text-[9px]">
            {["A1", "B1", "C1"].map((cell, i) => (
              <div key={cell} className="flex gap-2 border-b border-slate-100 py-1 dark:border-slate-800">
                <span className="w-6 text-slate-400">{cell}</span>
                <span
                  className={`h-1.5 flex-1 rounded ${i === 1 ? "bg-slate-800 dark:bg-slate-200" : "bg-slate-200 dark:bg-slate-700"}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MockLibrary() {
  const books = [
    { spine: "PDF", h: "h-14", color: "bg-rose-200 dark:bg-rose-500/30" },
    { spine: "DOC", h: "h-16", color: "bg-blue-200 dark:bg-blue-500/30" },
    { spine: "XLS", h: "h-12", color: "bg-emerald-200 dark:bg-emerald-500/30" },
    { spine: "PPT", h: "h-14", color: "bg-amber-200 dark:bg-amber-500/30" },
  ];
  return (
    <div className="relative">
      <div className="flex items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 pb-3 pt-8 dark:border-slate-700 dark:bg-slate-900/60">
        <div className="absolute inset-x-4 bottom-3 h-1 rounded bg-slate-300 dark:bg-slate-600" aria-hidden />
        {books.map((b) => (
          <div
            key={b.spine}
            className={`relative z-10 flex w-8 flex-col items-center justify-end rounded-t-sm border border-slate-300 ${b.color} ${b.h} dark:border-slate-600`}
          >
            <span className="mb-1 rotate-180 font-mono text-[7px] font-bold tracking-wider text-slate-600 [writing-mode:vertical-rl] dark:text-slate-300">
              {b.spine}
            </span>
          </div>
        ))}
      </div>
      <div className="absolute -right-1 top-2 max-w-[9rem] rounded-xl rounded-bl-sm border border-slate-200 bg-white px-2.5 py-2 shadow-lg dark:border-slate-600 dark:bg-slate-800">
        <div className="flex items-center gap-1">
          <MessagesSquare className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          <span className="text-[9px] font-semibold text-slate-700 dark:text-slate-200">Book Chat</span>
        </div>
        <p className="mt-1 text-[8px] leading-snug text-slate-500 dark:text-slate-400">이 문서에서 핵심 요약을 알려줘</p>
      </div>
    </div>
  );
}

type SceneCopy = { tag: string; title: string; desc: string };

function CompactFeatureStrip({ items }: { items: { tag: string; title: string }[] }) {
  return (
    <div className="border-b border-slate-200/80 py-5 dark:border-slate-700/80">
      <div className="mx-auto grid max-w-6xl gap-3 px-6 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.tag}
            className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40"
          >
            <span className="shrink-0 rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
              {item.tag}
            </span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StaticSceneBlock({
  scene,
  reversed,
  children,
  delay,
}: {
  scene: SceneCopy;
  reversed?: boolean;
  children: ReactNode;
  delay: number;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3, delay: reducedMotion ? 0 : delay, ease: [0.23, 1, 0.32, 1] }}
      className="grid items-center gap-6 md:grid-cols-2 md:gap-10"
    >
      <div className={reversed ? "md:order-2" : ""}>
        <span className="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
          {scene.tag}
        </span>
        <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-50">
          {scene.title}
        </h3>
        <p className="mt-2.5 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
          {scene.desc}
        </p>
      </div>
      <div className={reversed ? "md:order-1" : ""}>
        <div className="landing-card rounded-2xl p-4 sm:p-5">{children}</div>
      </div>
    </motion.div>
  );
}

export default function FeatureShowcase() {
  const t = useLandingT();
  const title = t("features.title");
  const subtitle = t("features.subtitle");
  const stripItems = [
    { tag: t("features.strip.summary.tag"), title: t("features.strip.summary.title") },
    { tag: t("features.strip.lecture.tag"), title: t("features.strip.lecture.title") },
  ];
  const scenes: SceneCopy[] = [
    { tag: t("features.docs.tag"), title: t("features.docs.title"), desc: t("features.docs.desc") },
    { tag: t("features.library.tag"), title: t("features.library.title"), desc: t("features.library.desc") },
  ];

  return (
    <>
      <CompactFeatureStrip items={stripItems} />
      <section id="features" className="scroll-mt-24 py-12 sm:py-14">
        <div className="mx-auto max-w-6xl space-y-12 px-6 sm:space-y-14">
          <div className="max-w-2xl">
            <h2 className="landing-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
              {title}
            </h2>
            <p className="mt-2 text-sm text-slate-600 sm:text-base dark:text-slate-400">{subtitle}</p>
          </div>
          <StaticSceneBlock scene={scenes[0]!} delay={0}>
            <MockDocs slideIndex={1} />
          </StaticSceneBlock>
          <StaticSceneBlock scene={scenes[1]!} reversed delay={0.05}>
            <MockLibrary />
          </StaticSceneBlock>
        </div>
      </section>
    </>
  );
}
