"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Presentation, Table2, MessagesSquare, FileText } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";
import {
  useScrollProgress,
  stickySceneIndex,
  sceneLocalProgress,
  trackTranslatePercent,
} from "@/lib/landingScroll";

const SCENE_COUNT = 2;

function TextLine({ w, tone = "base" }: { w: string; tone?: "base" | "faint" | "accent" }) {
  const bg =
    tone === "accent"
      ? "bg-blue-200/80 dark:bg-blue-500/30"
      : tone === "faint"
        ? "bg-slate-100 dark:bg-slate-800"
        : "bg-slate-200 dark:bg-slate-700/80";
  return <div className={`h-1.5 rounded-full ${bg}`} style={{ width: w }} />;
}

function MockDocs({ slideIndex = 0 }: { slideIndex?: number }) {
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
    <div className="border-b border-slate-200/80 py-8 dark:border-slate-700/80">
      <div className="mx-auto flex max-w-5xl flex-wrap gap-3 px-6">
        {items.map((item) => (
          <div
            key={item.tag}
            className="flex min-w-[min(100%,14rem)] flex-1 items-center gap-3 rounded-xl border border-slate-200/80 bg-white/60 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40"
          >
            <span className="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
              {item.tag}
            </span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <h2 className="landing-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base dark:text-slate-400">{subtitle}</p>
    </div>
  );
}

function StaticSceneBlock({ scene, reversed, children }: { scene: SceneCopy; reversed?: boolean; children: ReactNode }) {
  return (
    <div className="grid items-center gap-8 md:grid-cols-2">
      <div className={reversed ? "md:order-2" : ""}>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
            {scene.tag}
          </span>
        </div>
        <h3 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">{scene.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">{scene.desc}</p>
      </div>
      <div className={reversed ? "md:order-1" : ""}>
        <div className="landing-card rounded-2xl p-4">{children}</div>
      </div>
    </div>
  );
}

function ReducedMotionFeatures({
  title,
  subtitle,
  stripItems,
  scenes,
}: {
  title: string;
  subtitle: string;
  stripItems: { tag: string; title: string }[];
  scenes: SceneCopy[];
}) {
  return (
    <>
      <CompactFeatureStrip items={stripItems} />
      <section id="features" className="scroll-mt-24 py-20">
        <div className="mx-auto max-w-5xl space-y-16 px-6">
          <SectionHeader title={title} subtitle={subtitle} />
          {scenes.map((scene, i) => (
            <StaticSceneBlock key={scene.tag} scene={scene} reversed={i % 2 === 1}>
              {i === 0 ? <MockDocs /> : <MockLibrary />}
            </StaticSceneBlock>
          ))}
        </div>
      </section>
    </>
  );
}

export default function FeatureShowcase() {
  const t = useLandingT();
  const { sectionRef, p, reducedMotion, mounted } = useScrollProgress<HTMLElement>({ topOffset: 72 });
  const prevIdx = useRef(0);
  const [activeIdx, setActiveIdx] = useState(0);

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

  useEffect(() => {
    const next = stickySceneIndex(p, SCENE_COUNT, 0.1, prevIdx.current);
    prevIdx.current = next;
    setActiveIdx(next);
  }, [p]);

  const trackX = trackTranslatePercent(p, SCENE_COUNT);

  if (reducedMotion) {
    return <ReducedMotionFeatures title={title} subtitle={subtitle} stripItems={stripItems} scenes={scenes} />;
  }

  return (
    <>
      <CompactFeatureStrip items={stripItems} />
      <section ref={sectionRef} id="features" className="relative h-[320vh] scroll-mt-24">
        <div className="sticky top-0 flex min-h-[100svh] items-center py-16 sm:py-20">
          <div
            aria-hidden
            className="landing-scene-accent"
          />
          <div className="relative mx-auto w-full max-w-6xl px-6">
            <SectionHeader title={title} subtitle={subtitle} />
            <div className="mt-10 grid items-center gap-10 lg:mt-14 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="relative">
                <div className="absolute bottom-4 left-3 top-4 w-px bg-slate-200 dark:bg-slate-700" />
                <div
                  className="absolute left-3 top-4 w-px origin-top bg-blue-600 dark:bg-blue-400"
                  style={{
                    height: `${Math.min(100, (p / Math.max(0.001, (SCENE_COUNT - 1) / SCENE_COUNT)) * 100)}%`,
                    maxHeight: "calc(100% - 2rem)",
                  }}
                />
                <div className="space-y-10 pl-8">
                  {scenes.map((scene, i) => {
                    const isActive = i === activeIdx;
                    return (
                      <div key={scene.tag} className={`transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-70"}`}>
                        <div className="flex items-center gap-3">
                          <span
                            className={`relative z-10 flex h-3 w-3 shrink-0 rounded-full border-2 ${
                              isActive
                                ? "border-blue-600 bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.2)]"
                                : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
                            }`}
                          />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                            {scene.tag}
                          </p>
                        </div>
                        <h3
                          className={`mt-2 text-xl font-bold sm:text-2xl ${isActive ? "text-slate-900 dark:text-slate-50" : "text-slate-600 dark:text-slate-400"}`}
                        >
                          {scene.title}
                        </h3>
                        {isActive && (
                          <motion.div initial={mounted ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }}>
                            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{scene.desc}</p>
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
                    {[0, 1].map((i) => {
                      const sceneP = sceneLocalProgress(p, SCENE_COUNT, i);
                      return (
                        <div key={i} className="shrink-0 pr-0" style={{ width: `${100 / SCENE_COUNT}%` }}>
                          {i === 0 ? <MockDocs slideIndex={Math.floor(sceneP * 5)} /> : <MockLibrary />}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4 flex gap-2 border-t border-slate-200/80 pt-4 dark:border-slate-700">
                  {[
                    { Icon: Presentation, idx: 0 },
                    { Icon: MessagesSquare, idx: 1 },
                  ].map(({ Icon, idx }) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        idx === activeIdx
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
