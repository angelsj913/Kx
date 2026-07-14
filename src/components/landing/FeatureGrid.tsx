"use client";

import { BookOpen, LibraryBig, MessagesSquare, ScanSearch, FileType2, Shuffle } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";

export default function FeatureGrid() {
  const t = useLandingT();

  // 실제 제공 기능 중심 — 공유 서재·파일 미리보기·팀 협업 반영
  const items = [
    { icon: BookOpen, label: t("grid.bookChat.label"), desc: t("grid.bookChat.desc") },
    { icon: LibraryBig, label: t("grid.library.label"), desc: t("grid.library.desc") },
    { icon: MessagesSquare, label: t("grid.lectureChat.label"), desc: t("grid.lectureChat.desc") },
    { icon: ScanSearch, label: t("grid.examAnalysis.label"), desc: t("grid.examAnalysis.desc") },
    { icon: FileType2, label: t("grid.docConvert.label"), desc: t("grid.docConvert.desc") },
    { icon: Shuffle, label: t("grid.similarProblems.label"), desc: t("grid.similarProblems.desc") },
  ];

  return (
    <section className="bg-slate-50 py-20 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            {t("grid.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base dark:text-slate-400">
            {t("grid.subtitle")}
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.03] hover:border-blue-500/70 hover:shadow-xl hover:shadow-blue-600/20 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/15 transition-colors duration-400 group-hover:bg-blue-600">
                <Icon className="h-5 w-5 text-blue-600 transition-colors duration-400 group-hover:text-white dark:text-blue-400" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">{label}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
