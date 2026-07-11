"use client";

import Link from "next/link";
import { BookOpen, LibraryBig, MessagesSquare, ScanSearch, Copy, FileType2, Shuffle } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";

export default function FeatureGrid() {
  const t = useLandingT();

  const items = [
    { icon: BookOpen, label: t("grid.bookChat.label"), desc: t("grid.bookChat.desc") },
    { icon: LibraryBig, label: t("grid.library.label"), desc: t("grid.library.desc") },
    { icon: MessagesSquare, label: t("grid.lectureChat.label"), desc: t("grid.lectureChat.desc") },
    { icon: ScanSearch, label: t("grid.examAnalysis.label"), desc: t("grid.examAnalysis.desc") },
    { icon: Copy, label: t("grid.examSimilarity.label"), desc: t("grid.examSimilarity.desc") },
    { icon: FileType2, label: t("grid.docConvert.label"), desc: t("grid.docConvert.desc") },
    { icon: Shuffle, label: t("grid.similarProblems.label"), desc: t("grid.similarProblems.desc") },
  ];

  return (
    <section className="bg-slate-950 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">{t("grid.title")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400 sm:text-base">{t("grid.subtitle")}</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.03] hover:border-blue-500/70 hover:shadow-xl hover:shadow-blue-600/20"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/15 transition-colors duration-400 group-hover:bg-blue-600">
                <Icon className="h-5 w-5 text-blue-400 transition-colors duration-400 group-hover:text-white" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-100">{label}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/login?callbackUrl=/app"
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] hover:bg-blue-500"
          >
            {t("grid.cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
