"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, Atom, FileBarChart, Sparkles } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";

export default function SkillsSection() {
  const t = useLandingT();
  const { status } = useSession();
  const appHref = status === "authenticated" ? "/app" : "/login?callbackUrl=%2Fapp";

  const skills = [
    {
      id: "design",
      href: "/design",
      icon: Sparkles,
      title: t("skills.design.title"),
      desc: t("skills.design.desc"),
      cta: t("skills.design.cta"),
    },
    {
      id: "stem",
      href: appHref,
      icon: Atom,
      title: t("skills.stem.title"),
      desc: t("skills.stem.desc"),
      cta: t("skills.stem.cta"),
    },
    {
      id: "report",
      href: appHref,
      icon: FileBarChart,
      title: t("skills.report.title"),
      desc: t("skills.report.desc"),
      cta: t("skills.report.cta"),
    },
  ] as const;

  return (
    <>
      <section id="skills" className="scroll-mt-24 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-2xl">
            <p className="landing-label text-xs text-[color:var(--landing-text-muted)]">
              {t("skills.eyebrow")}
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[color:var(--landing-text-primary)] sm:text-3xl">
              {t("skills.title")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--landing-text-muted)] sm:text-base">
              {t("skills.subtitle")}
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {skills.map(({ id, href, icon: Icon, title, desc, cta }) => (
              <Link
                key={id}
                href={href}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-[var(--landing-accent)]/50 dark:border-slate-800 dark:bg-slate-900/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--landing-accent)]/10 text-[var(--landing-accent)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {desc}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--landing-accent)]">
                  {cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-[var(--landing-bg-soft)] py-14 dark:border-slate-800">
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
