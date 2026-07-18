"use client";

import { useMemo, useRef, useState } from "react";
import { Plus, Trash2, BookMarked, List } from "lucide-react";
import { useAutosave } from "@/lib/useAutosave";
import SaveIndicator from "./SaveIndicator";
import type { ResearchDraft } from "@/lib/structured";
import { useT } from "@/lib/i18n";

export default function ResearchDraftView({
  id,
  initial,
}: {
  id: string;
  initial: ResearchDraft;
}) {
  const t = useT();
  const [data, setData] = useState(initial);
  const status = useAutosave(id, data);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const charCount = useMemo(
    () => data.sections.reduce((sum, s) => sum + s.body.length, 0),
    [data.sections]
  );

  function updateSection(i: number, patch: Partial<ResearchDraft["sections"][number]>) {
    setData((d) => ({
      ...d,
      sections: d.sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
  }
  function addSection() {
    setData((d) => ({
      ...d,
      sections: [...d.sections, { heading: t("structured.researchDraft.defaultSectionHeading"), body: "" }],
    }));
  }
  function removeSection(i: number) {
    setData((d) => ({ ...d, sections: d.sections.filter((_, idx) => idx !== i) }));
  }

  function updateCitation(i: number, patch: Partial<ResearchDraft["citations"][number]>) {
    setData((d) => ({
      ...d,
      citations: d.citations.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    }));
  }
  function addCitation() {
    setData((d) => ({
      ...d,
      citations: [...d.citations, { source: "", author: "", note: "" }],
    }));
  }
  function removeCitation(i: number) {
    setData((d) => ({ ...d, citations: d.citations.filter((_, idx) => idx !== i) }));
  }

  function jumpTo(i: number) {
    sectionRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white shadow-sm dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-black/40 dark:backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <BookMarked className="h-4 w-4 text-[var(--mode-accent)]" />
          {t("structured.researchDraft.title")}
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-slate-500">
            {charCount.toLocaleString()}{t("structured.researchDraft.charCountSuffix")}
          </span>
          <SaveIndicator status={status} />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,11rem)_1fr] overflow-hidden sm:grid-cols-[minmax(0,13rem)_1fr]">
        {/* 아웃라인 사이드바 */}
        <nav className="min-h-0 overflow-y-auto border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/30 p-3">
          <p className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <List className="h-3.5 w-3.5" /> {t("structured.researchDraft.toc")}
          </p>
          <ul className="space-y-0.5">
            {data.sections.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => jumpTo(i)}
                  className="w-full truncate rounded-lg px-2 py-1.5 text-left text-xs text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-[var(--mode-accent)]"
                  title={s.heading}
                >
                  {s.heading || `${t("structured.researchDraft.sectionFallbackPrefix")} ${i + 1}`}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={addSection}
            className="mt-2 flex w-full items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-2 py-1.5 text-xs font-medium text-[var(--mode-accent)] transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/40"
          >
            <Plus className="h-3.5 w-3.5" /> {t("structured.researchDraft.addSection")}
          </button>
        </nav>

        {/* 본문 + 인용 로그 */}
        <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
          <div className="space-y-5">
            {data.sections.map((s, i) => (
              <div
                key={i}
                ref={(el) => {
                  sectionRefs.current[i] = el;
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/40 p-4"
              >
                <div className="flex items-start gap-2">
                  <input
                    type="text"
                    value={s.heading}
                    onChange={(e) => updateSection(i, { heading: e.target.value })}
                    className="w-full flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 px-3 py-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
                  />
                  <button
                    type="button"
                    onClick={() => removeSection(i)}
                    aria-label={t("structured.researchDraft.removeSectionAria")}
                    className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:text-red-500 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <textarea
                  value={s.body}
                  onChange={(e) => updateSection(i, { body: e.target.value })}
                  rows={5}
                  className="mt-2 w-full resize-y rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 p-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300 outline-none transition-colors focus:border-[var(--mode-accent)]/70"
                />
              </div>
            ))}
          </div>

          {/* 인용/출처 로그 테이블 */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("structured.researchDraft.citationsHeading")}</h3>
              <button
                type="button"
                onClick={addCitation}
                className="flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs font-medium text-[var(--mode-accent)] transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/40"
              >
                <Plus className="h-3.5 w-3.5" /> {t("structured.researchDraft.addCitation")}
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-white dark:bg-slate-900/60">
                    <th className="whitespace-nowrap border-b border-slate-200 dark:border-slate-800 px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
                      {t("structured.researchDraft.sourceCol")}
                    </th>
                    <th className="whitespace-nowrap border-b border-slate-200 dark:border-slate-800 px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
                      {t("structured.researchDraft.authorCol")}
                    </th>
                    <th className="whitespace-nowrap border-b border-slate-200 dark:border-slate-800 px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
                      {t("structured.researchDraft.noteCol")}
                    </th>
                    <th className="w-8 border-b border-slate-200 dark:border-slate-800" />
                  </tr>
                </thead>
                <tbody>
                  {data.citations.map((c, i) => (
                    <tr key={i} className="odd:bg-slate-900/20">
                      <td className="border-b border-slate-200 dark:border-slate-800/60 px-2 py-1.5">
                        <input
                          type="text"
                          value={c.source}
                          onChange={(e) => updateCitation(i, { source: e.target.value })}
                          className="w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-slate-700 dark:text-slate-300 outline-none transition-colors focus:border-[var(--mode-accent)]/50 focus:bg-slate-50 dark:bg-slate-950/40"
                        />
                      </td>
                      <td className="border-b border-slate-200 dark:border-slate-800/60 px-2 py-1.5">
                        <input
                          type="text"
                          value={c.author}
                          onChange={(e) => updateCitation(i, { author: e.target.value })}
                          className="w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-slate-700 dark:text-slate-300 outline-none transition-colors focus:border-[var(--mode-accent)]/50 focus:bg-slate-50 dark:bg-slate-950/40"
                        />
                      </td>
                      <td className="border-b border-slate-200 dark:border-slate-800/60 px-2 py-1.5">
                        <input
                          type="text"
                          value={c.note}
                          onChange={(e) => updateCitation(i, { note: e.target.value })}
                          className="w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-slate-700 dark:text-slate-300 outline-none transition-colors focus:border-[var(--mode-accent)]/50 focus:bg-slate-50 dark:bg-slate-950/40"
                        />
                      </td>
                      <td className="border-b border-slate-200 dark:border-slate-800/60 px-1 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeCitation(i)}
                          aria-label={t("structured.researchDraft.removeCitationAria")}
                          className="rounded-md p-1 text-slate-500 transition-colors hover:text-red-500 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data.citations.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-xs text-slate-500">
                        {t("structured.researchDraft.emptyCitations")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
