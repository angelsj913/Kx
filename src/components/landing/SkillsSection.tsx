"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";
import { useScrollProgress, stickySceneIndex, sceneLocalProgress } from "@/lib/landingScroll";
import LandingLight3D from "@/components/landing/LandingLight3D";

const SCENE_COUNT = 3;

type SkillScene = {
  id: string;
  href: string;
  title: string;
  desc: string;
  cta: string;
};

function SceneBackground({ sceneId, progress }: { sceneId: string; progress: number }) {
  const fade = 0.35 + progress * 0.45;

  if (sceneId === "design") {
    return (
      <div className="absolute inset-0 overflow-hidden bg-transparent">
        <div className="landing-scene-accent" style={{ opacity: fade }} />
        <LandingLight3D className="absolute right-[4%] top-[10%] h-[min(52vw,22rem)] w-[min(52vw,22rem)] opacity-70 sm:right-[6%] sm:top-[12%]" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-end pr-[6%] pt-[12%]">
          <div className="grid grid-cols-3 gap-3 opacity-[0.55]" style={{ transform: `translateY(${(1 - progress) * 12}px)` }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`aspect-[4/5] rounded-xl border border-blue-200/60 bg-white/40 shadow-sm backdrop-blur-sm dark:border-blue-500/20 dark:bg-slate-900/30 ${
                  i % 3 === 1 ? "mt-6" : ""
                }`}
                style={{ opacity: 0.4 + (i / 6) * 0.5 * progress }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sceneId === "stem") {
    return (
      <div className="absolute inset-0 overflow-hidden bg-transparent">
        <div className="landing-scene-accent" style={{ opacity: fade * 0.85 }} />
        <svg
          className="pointer-events-none absolute bottom-[12%] right-[8%] h-[42%] w-[42%] text-blue-600/20 dark:text-blue-400/15"
          viewBox="0 0 200 200"
          fill="none"
          aria-hidden
          style={{ transform: `scale(${0.92 + progress * 0.08})` }}
        >
          <path d="M20 160 L100 40 L180 160" stroke="currentColor" strokeWidth="1.5" />
          <path d="M50 120 L150 120" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="100" cy="40" r="4" fill="currentColor" />
          <text x="105" y="38" className="fill-current text-[10px] font-mono" style={{ fontSize: 10 }}>
            f(x)
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-transparent">
      <div className="landing-scene-accent" style={{ opacity: fade * 0.9 }} />
      <div className="pointer-events-none absolute bottom-[14%] left-[8%] w-[38%] space-y-2" style={{ opacity: 0.35 + progress * 0.4 }}>
        <div className="h-1.5 w-full rounded-full bg-slate-300/80 dark:bg-slate-600/60" />
        <div className="h-1.5 w-[85%] rounded-full bg-slate-200/80 dark:bg-slate-700/60" />
        <div className="mt-4 flex h-16 items-end gap-1.5">
          {[48, 72, 55, 88, 62].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-blue-600/25 dark:bg-blue-400/20"
              style={{ height: `${h * (0.5 + progress * 0.5)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SceneContent({
  scene,
  mounted,
  localP,
}: {
  scene: SkillScene;
  mounted: boolean;
  localP: number;
}) {
  return (
    <motion.div
      key={scene.id}
      initial={mounted ? { opacity: 0, y: 16 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-xl"
      style={{ opacity: 0.85 + localP * 0.15 }}
    >
      <h3 className="landing-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
        {scene.title}
      </h3>
      <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">{scene.desc}</p>
      <Link
        href={scene.href}
        className="mt-8 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[#2563EB] transition-opacity hover:opacity-80 dark:text-blue-400"
      >
        {scene.cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}

function ReducedMotionSkills({ scenes, appHref }: { scenes: SkillScene[]; appHref: string }) {
  const t = useLandingT();

  return (
    <>
      <section id="skills" className="scroll-mt-24 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-2xl">
            <p className="landing-label text-xs text-[color:var(--landing-text-muted)]">{t("skills.eyebrow")}</p>
            <h2 className="landing-display mt-3 text-2xl font-bold tracking-tight text-[color:var(--landing-text-primary)] sm:text-3xl">
              {t("skills.title")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--landing-text-muted)] sm:text-base">
              {t("skills.subtitle")}
            </p>
          </div>

          <div className="mt-14 space-y-16">
            {scenes.map((scene) => (
              <div key={scene.id} className="relative overflow-hidden rounded-2xl py-14 sm:py-16">
                <SceneBackground sceneId={scene.id} progress={1} />
                <div className="relative px-8 sm:px-12">
                  <SceneContent scene={scene} mounted={false} localP={1} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section-rule py-14">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-xl font-bold tracking-tight text-[color:var(--landing-text-primary)] sm:text-2xl">
            {t("skills.band.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--landing-text-muted)] sm:text-base">
            {t("skills.band.subtitle")}
          </p>
          <Link
            href={appHref}
            className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--landing-accent)] px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("header.startWeb")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

export default function SkillsSection() {
  const t = useLandingT();
  // /app is proxy-protected — guests redirect to login without a session fetch here.
  const appHref = "/app";
  const { sectionRef, p, reducedMotion, mounted } = useScrollProgress<HTMLElement>({ topOffset: 72 });
  const prevIdx = useRef(0);
  const [activeIdx, setActiveIdx] = useState(0);

  const scenes: SkillScene[] = [
    {
      id: "design",
      href: "/design",
      title: t("skills.design.title"),
      desc: t("skills.design.desc"),
      cta: t("skills.design.cta"),
    },
    {
      id: "stem",
      href: appHref,
      title: t("skills.stem.title"),
      desc: t("skills.stem.desc"),
      cta: t("skills.stem.cta"),
    },
    {
      id: "report",
      href: appHref,
      title: t("skills.report.title"),
      desc: t("skills.report.desc"),
      cta: t("skills.report.cta"),
    },
  ];

  useEffect(() => {
    const next = stickySceneIndex(p, SCENE_COUNT, 0.1, prevIdx.current);
    prevIdx.current = next;
    setActiveIdx(next);
  }, [p]);

  if (reducedMotion) {
    return <ReducedMotionSkills scenes={scenes} appHref={appHref} />;
  }

  const activeScene = scenes[activeIdx]!;

  return (
    <>
      <section ref={sectionRef} id="skills" className="relative h-[360vh] scroll-mt-24">
        <div className="sticky top-0 min-h-[100svh] overflow-hidden">
          {scenes.map((scene, i) => {
            const sceneP = sceneLocalProgress(p, SCENE_COUNT, i);
            const isActive = i === activeIdx;
            const opacity = isActive ? Math.min(1, 0.15 + sceneP * 0.85) : 0;
            return (
              <div
                key={scene.id}
                className="absolute inset-0 transition-opacity duration-500"
                style={{ opacity, pointerEvents: isActive ? "auto" : "none" }}
                aria-hidden={!isActive}
              >
                <SceneBackground sceneId={scene.id} progress={sceneP} />
              </div>
            );
          })}

          <div className="relative z-10 flex min-h-[100svh] flex-col justify-center py-16 sm:py-20">
            <div className="mx-auto w-full max-w-5xl px-6">
              <div className="mb-10 max-w-2xl sm:mb-14">
                <p className="landing-label text-xs text-[color:var(--landing-text-muted)]">{t("skills.eyebrow")}</p>
                <h2 className="landing-display mt-3 text-2xl font-bold tracking-tight text-[color:var(--landing-text-primary)] sm:text-3xl">
                  {t("skills.title")}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[color:var(--landing-text-muted)] sm:text-base">
                  {t("skills.subtitle")}
                </p>
              </div>

              <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
                <SceneContent scene={activeScene} mounted={mounted} localP={sceneLocalProgress(p, SCENE_COUNT, activeIdx)} />

                <ol
                  className="flex list-none items-center gap-3 lg:flex-col lg:items-end lg:gap-4"
                  aria-hidden="true"
                >
                  {scenes.map((scene, i) => (
                    <li key={scene.id} className="flex items-center gap-2 lg:flex-row-reverse">
                      <span
                        className={`block h-1.5 rounded-full transition-all duration-300 ${
                          i === activeIdx
                            ? "w-8 bg-[#2563EB] dark:bg-blue-400"
                            : "w-4 bg-slate-300 dark:bg-slate-600"
                        }`}
                      />
                      <span
                        className={`hidden text-[10px] font-semibold uppercase tracking-widest sm:block ${
                          i === activeIdx ? "text-[#2563EB] dark:text-blue-400" : "text-slate-400"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section-rule py-14">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-xl font-bold tracking-tight text-[color:var(--landing-text-primary)] sm:text-2xl">
            {t("skills.band.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--landing-text-muted)] sm:text-base">
            {t("skills.band.subtitle")}
          </p>
          <Link
            href={appHref}
            className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--landing-accent)] px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("header.startWeb")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
