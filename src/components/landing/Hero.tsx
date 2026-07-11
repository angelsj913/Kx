"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Apple, Sparkles, X } from "lucide-react";
import { WINDOWS_DOWNLOAD_URL, MAC_DOWNLOAD_URL } from "@/lib/constants";
import { useLandingT } from "@/lib/landingI18n";

type OS = "windows" | "mac";

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 5.1 10.5 4v7.5H3V5.1Zm0 13.8L10.5 20v-7.4H3v6.3ZM11.6 3.85 21 2.5v9H11.6V3.85Zm0 16.3L21 21.5v-9H11.6v7.65Z" />
    </svg>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

export default function Hero() {
  const t = useLandingT();
  const [selected, setSelected] = useState<OS | null>(null);

  const info =
    selected === "windows"
      ? {
          title: t("hero.modal.windowsTitle"),
          note: t("hero.modal.windowsNote"),
          url: WINDOWS_DOWNLOAD_URL,
          icon: Download,
        }
      : selected === "mac"
        ? {
            title: t("hero.modal.macTitle"),
            note: t("hero.modal.macNote"),
            url: MAC_DOWNLOAD_URL,
            icon: Apple,
          }
        : null;

  return (
    <section id="about" className="relative overflow-hidden pb-8 pt-32 sm:pt-40">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[140px]" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto flex max-w-4xl flex-col items-center px-6 text-center"
      >
        <motion.span
          variants={fadeUp}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-medium text-blue-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-blue-300"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {t("hero.badge")}
        </motion.span>

        <motion.h1
          variants={fadeUp}
          className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-6xl dark:text-slate-50"
        >
          {t("hero.title.line1")}
          <br />
          <span className="text-blue-600 dark:text-blue-400">{t("hero.title.line2")}</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300"
        >
          {t("hero.subtitle")}
        </motion.p>

        <motion.div
          id="download"
          variants={fadeUp}
          className="mt-10 flex w-full max-w-xl scroll-mt-32 flex-col gap-4 sm:flex-row sm:justify-center"
        >
          <button
            type="button"
            onClick={() => setSelected("windows")}
            className="group flex flex-1 items-center justify-center gap-3 rounded-2xl bg-blue-600 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:scale-[1.02] hover:bg-blue-500 active:scale-[0.98]"
          >
            <WindowsIcon className="h-6 w-6" />
            {t("hero.download.windows")}
            <Download className="ml-1 h-4 w-4 opacity-70 transition-transform duration-300 group-hover:translate-y-0.5" />
          </button>
          <button
            type="button"
            onClick={() => setSelected("mac")}
            className="group flex flex-1 items-center justify-center gap-3 rounded-2xl bg-blue-600 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:scale-[1.02] hover:bg-blue-500 active:scale-[0.98]"
          >
            <Apple className="h-6 w-6" />
            {t("hero.download.mac")}
            <Download className="ml-1 h-4 w-4 opacity-70 transition-transform duration-300 group-hover:translate-y-0.5" />
          </button>
        </motion.div>

        <motion.p variants={fadeUp} className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          {t("hero.download.note")}
        </motion.p>
      </motion.div>

      {info && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="close"
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
              <info.icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-50">{info.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{info.note}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("hero.modal.instruction")}</p>

            <a
              href={info.url}
              download
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-500"
            >
              <Download className="h-4 w-4" />
              {t("hero.modal.confirm")}
            </a>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-3 flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-blue-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {t("hero.modal.cancel")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
