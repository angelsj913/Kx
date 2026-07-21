"use client";

import { useState } from "react";
import { Sparkles, Download, FileText, Presentation, Table2 } from "lucide-react";
import type { Deck, Workbook, GeneratedFile } from "@/lib/fileTypes";
import { useT } from "@/lib/i18n";

export default function FileResultPanel({
  outputType,
  deck,
  workbook,
  file,
}: {
  outputType: "pptx" | "xlsx";
  deck?: Deck;
  workbook?: Workbook;
  file?: GeneratedFile;
}) {
  const t = useT();
  const isPptx = outputType === "pptx";
  const title = isPptx ? deck?.title : workbook?.title;
  const HeaderIcon = isPptx ? Presentation : Table2;
  const [activeSlide, setActiveSlide] = useState(0);
  const selectedSlide = deck?.slides[activeSlide];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-black/40 dark:backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-5 dark:border-slate-800">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Sparkles className="h-4 w-4 shrink-0 text-[var(--mode-accent)]" />
          <span className="truncate">{title || t("fileResult.defaultTitle")}</span>
        </h2>
        {file && (
          <a
            href={file.url}
            download={file.filename}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--mode-accent)] to-[var(--mode-accent-deep)] px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-black/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="h-3.5 w-3.5" />
            {isPptx ? t("fileResult.downloadPpt") : t("fileResult.downloadExcel")}
          </a>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        {isPptx && deck ? (
          <div className="space-y-3">
            {(deck.subtitle || deck.title) && (
              <div className="rounded-xl border border-blue-200/60 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 dark:border-blue-900/40 dark:from-blue-950/40 dark:to-indigo-950/30">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                  {t("fileResult.coverLabel")}
                </p>
                <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                  {deck.title}
                </p>
                {deck.subtitle && (
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{deck.subtitle}</p>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {deck.slides.map((s, i) => (
                <button
                  type="button"
                  key={`thumb-${i}`}
                  onClick={() => setActiveSlide(i)}
                  className={`aspect-video overflow-hidden rounded-lg border bg-gradient-to-br p-2 text-left transition ${
                    activeSlide === i
                      ? "border-blue-500 ring-2 ring-blue-500/30 dark:border-blue-400"
                      : "border-slate-200 from-slate-100 to-slate-200 hover:border-blue-300 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900"
                  }`}
                  title={s.title}
                >
                  <p className="text-[9px] font-bold text-slate-500">{i + 1}</p>
                  <p className="mt-0.5 line-clamp-2 text-[10px] font-semibold text-slate-800 dark:text-slate-100">
                    {s.title}
                  </p>
                  {s.bullets?.[0] && (
                    <p className="mt-1 line-clamp-2 text-[9px] text-slate-500">{s.bullets[0]}</p>
                  )}
                </button>
              ))}
            </div>
            {selectedSlide && (
              <div className="animate-in fade-in slide-in-from-bottom-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm duration-300 dark:border-slate-700 dark:bg-slate-950/40">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--mode-accent)]">
                  Slide {activeSlide + 1} · {selectedSlide.layout ?? "content"}
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">{selectedSlide.title}</h3>
                {selectedSlide.subtitle && <p className="mt-1 text-sm text-slate-500">{selectedSlide.subtitle}</p>}
                {selectedSlide.bullets?.length ? (
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {selectedSlide.bullets.map((bullet, index) => <li key={index}>{bullet}</li>)}
                  </ul>
                ) : null}
              </div>
            )}
            <ol className="space-y-3">
              {deck.slides.map((s, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--mode-accent)]/20 text-[11px] font-bold text-[var(--mode-accent)]">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {s.title}
                        </h3>
                        {s.layout && s.layout !== "content" && (
                          <span className="rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {s.layout}
                          </span>
                        )}
                      </div>
                      {s.subtitle && (
                        <p className="mt-0.5 text-xs text-slate-500">{s.subtitle}</p>
                      )}
                    </div>
                  </div>
                  {s.bullets && s.bullets.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-8 text-sm text-slate-600 dark:text-slate-400">
                      {s.bullets.map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {s.bulletsRight && s.bulletsRight.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 border-l-2 border-indigo-200 pl-8 text-sm text-slate-600 dark:border-indigo-800 dark:text-slate-400">
                      {s.bulletsRight.map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {s.table && s.table.headers?.length > 0 && (
                    <div className="mt-2 overflow-x-auto pl-2">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-blue-600 text-white">
                            {s.table.headers.map((h, hi) => (
                              <th key={hi} className="px-2 py-1.5 font-semibold">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {s.table.rows.map((row, ri) => (
                            <tr
                              key={ri}
                              className={
                                ri % 2 === 0
                                  ? "bg-white dark:bg-slate-900/40"
                                  : "bg-slate-100 dark:bg-slate-800/40"
                              }
                            >
                              {row.map((cell, ci) => (
                                <td
                                  key={ci}
                                  className="border-b border-slate-100 px-2 py-1 text-slate-600 dark:border-slate-800 dark:text-slate-300"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {s.diagram && s.diagram.steps?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 pl-2">
                      {s.diagram.steps.map((step, si) => (
                        <div
                          key={si}
                          className="min-w-[7rem] flex-1 rounded-lg border border-blue-200/70 bg-blue-50/80 px-2.5 py-2 dark:border-blue-900/50 dark:bg-blue-950/30"
                        >
                          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                            {si + 1}. {s.diagram?.type || "step"}
                          </p>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                            {step.label}
                          </p>
                          {step.desc && (
                            <p className="mt-0.5 text-[11px] text-slate-500">{step.desc}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {s.notes && (
                    <p className="mt-2 flex items-start gap-1.5 pl-8 text-xs text-slate-500">
                      <FileText className="mt-0.5 h-3 w-3 shrink-0" />
                      {s.notes}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ) : workbook ? (
          <div className="space-y-6">
            {workbook.sheets.map((sheet, si) => (
              <div key={si}>
                <p className="mb-2 text-xs font-semibold text-[var(--mode-accent)]">
                  {sheet.name}
                </p>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900/60">
                        {sheet.columns.map((c, i) => (
                          <th
                            key={i}
                            className="whitespace-nowrap border-b border-slate-200 px-3 py-2 font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200"
                          >
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.rows.map((row, ri) => (
                        <tr key={ri} className="odd:bg-slate-50 dark:odd:bg-slate-900/20">
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-600 dark:border-slate-800/60 dark:text-slate-400"
                            >
                              {String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
              <HeaderIcon className="h-7 w-7 text-slate-400 dark:text-slate-600" />
            </div>
            <p className="text-sm text-slate-500">{t("fileResult.emptyResult")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
