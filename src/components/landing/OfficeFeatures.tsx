"use client";

import { Presentation, Table2, FileText } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";

export default function OfficeFeatures() {
  const t = useLandingT();

  const items = [
    { icon: Presentation, title: t("office.ppt.title"), desc: t("office.ppt.desc"), detail: t("office.ppt.detail") },
    { icon: Table2, title: t("office.excel.title"), desc: t("office.excel.desc"), detail: t("office.excel.detail") },
    { icon: FileText, title: t("office.word.title"), desc: t("office.word.desc"), detail: t("office.word.detail") },
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="mx-auto max-w-2xl text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            {t("office.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base dark:text-slate-300">{t("office.subtitle")}</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {items.map(({ icon: Icon, title, desc, detail }) => (
            <div
              key={title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.03] hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-600/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/60"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/30">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{desc}</p>
              <div className="grid grid-rows-[0fr] transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:grid-rows-[1fr]">
                <div className="overflow-hidden">
                  <p className="mt-3 text-sm leading-relaxed text-blue-600 dark:text-blue-400">{detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
