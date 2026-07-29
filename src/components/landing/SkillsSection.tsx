"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Palette, FunctionSquare, BarChart3 } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";
import { useReducedMotion } from "@/lib/useReducedMotion";
import LandingLight3D from "@/components/landing/LandingLight3D";

const SKILL_META = [
  { id: "design", href: "/design", icon: Palette, titleKey: "skills.design.title", descKey: "skills.design.desc", ctaKey: "skills.design.cta" },
  { id: "stem", href: "/app", icon: FunctionSquare, titleKey: "skills.stem.title", descKey: "skills.stem.desc", ctaKey: "skills.stem.cta" },
  { id: "report", href: "/app", icon: BarChart3, titleKey: "skills.report.title", descKey: "skills.report.desc", ctaKey: "skills.report.cta" },
] as const;

function SkillVisual({ id }: { id: string }) {
  if (id === "design") {
    return (
      <div className="relative h-28 overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <LandingLight3D className="absolute -right-2 -top-2 h-32 w-32 opacity-70" />
        <div className="absolute inset-0 flex items-end justify-end gap-1.5 p-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-10 rounded-lg border border-blue-200/60 bg-white/70 shadow-sm backdrop-blur-sm dark:border-blue-500/20 dark:bg-slate-900/50 ${
                i === 1 ? "h-16" : "h-12"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }
  if (id === "stem") {
    return (
      <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-950">
        <svg className="h-20 w-20 text-blue-600/30 dark:text-blue-400/25" viewBox="0 0 200 200" fill="none" aria-hidden>
          <path d="M20 160 L100 40 L180 160" stroke="currentColor" strokeWidth="3" />
          <path d="M50 120 L150 120" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
          <circle cx="100" cy="40" r="6" fill="currentColor" />
        </svg>
      </div>
    );
  }
  return (
    <div className="relative flex h-28 items-end gap-1.5 overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 px-6 pb-4 dark:from-slate-900 dark:to-slate-950">
      {[48, 72, 55, 88, 62].map((h, i) => (
        <div key={i} className="flex-1 rounded-t bg-blue-600/30 dark:bg-blue-400/25" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export default function SkillsSection() {
  const t = useLandingT();
  const reducedMotion = useReducedMotion();
  const appHref = "/app";

  return (
    <>
      <section id="skills" className="landing-section-rule scroll-mt-24 py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="landing-label text-xs text-[color:var(--landing-text-muted)]">{t("skills.eyebrow")}</p>
              <h2 className="landing-display mt-2 text-2xl font-bold tracking-tight text-[color:var(--landing-text-primary)] sm:text-3xl">
                {t("skills.title")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--landing-text-muted)] sm:text-base">
                {t("skills.subtitle")}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {SKILL_META.map(({ id, href, icon: Icon, titleKey, descKey, ctaKey }, i) => (
              <motion.article
                key={id}
                initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.28, delay: reducedMotion ? 0 : i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                className="landing-card flex flex-col overflow-hidden rounded-2xl"
              >
                <SkillVisual id={id} />
                <div className="flex flex-1 flex-col p-5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--landing-accent-muted)] text-[var(--landing-accent)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="mt-3 text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    {t(titleKey)}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {t(descKey)}
                  </p>
                  <Link
                    href={href === "/app" ? appHref : href}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--landing-accent)] transition-opacity hover:opacity-80"
                  >
                    {t(ctaKey)}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-[var(--landing-accent-muted)]/40 py-10 dark:border-slate-800 dark:bg-blue-500/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-lg font-bold tracking-tight text-[color:var(--landing-text-primary)] sm:text-xl">
              {t("skills.band.title")}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--landing-text-muted)]">
              {t("skills.band.subtitle")}
            </p>
          </div>
          <Link
            href={appHref}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full bg-[var(--landing-accent)] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("header.startWeb")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
