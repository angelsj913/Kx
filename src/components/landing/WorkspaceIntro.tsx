"use client";

import Link from "next/link";
import { ArrowRight, MessagesSquare, FileStack, Library } from "lucide-react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useLandingT } from "@/lib/landingI18n";
import { useReducedMotion } from "@/lib/useReducedMotion";

const PILLARS = [
  { icon: MessagesSquare, titleKey: "workspace.feature1.title" as const, descKey: "workspace.feature1.desc" as const },
  { icon: FileStack, titleKey: "workspace.feature2.title" as const, descKey: "workspace.feature2.desc" as const },
  { icon: Library, titleKey: "workspace.feature3.title" as const, descKey: "workspace.feature3.desc" as const },
];

export default function WorkspaceIntro() {
  const t = useLandingT();
  const { status } = useSession();
  const reducedMotion = useReducedMotion();
  const appHref = status === "authenticated" ? "/app" : "/login?callbackUrl=%2Fapp";

  return (
    <section className="landing-section-rule scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="landing-label text-xs text-[color:var(--landing-text-muted)]">{t("skills.eyebrow")}</p>
          <h2 className="landing-display mx-auto mt-3 max-w-2xl break-keep text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            {t("workspace.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base dark:text-slate-300">
            {t("workspace.subtitle")}
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {PILLARS.map(({ icon: Icon, titleKey, descKey }, i) => (
            <motion.div
              key={titleKey}
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.28, delay: reducedMotion ? 0 : i * 0.06, ease: [0.23, 1, 0.32, 1] }}
              className="landing-card rounded-2xl p-5 text-left"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--landing-accent-muted)] text-[var(--landing-accent)]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-50">{t(titleKey)}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{t(descKey)}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href={appHref}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--landing-accent)] px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            {t("header.startWeb")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
