"use client";

import { useState } from "react";
import { LayoutTemplate, Plus, Trash2, Presentation } from "lucide-react";
import { useAutosave } from "@/lib/useAutosave";
import SaveIndicator from "./SaveIndicator";
import PanelShell from "./PanelShell";
import type { PptOutlineDraft, PptOutlineSlide } from "@/lib/pptOutline";
import { useT } from "@/lib/i18n";

const LAYOUT_OPTIONS = [
  "agenda",
  "section",
  "content",
  "twoColumn",
  "table",
  "process",
  "cycle",
  "cards",
  "closing",
] as const;

const THEME_OPTIONS = [
  "legal",
  "startup",
  "healthcare",
  "science",
  "nature",
  "medical",
  "business",
  "tech",
  "education",
  "creative",
  "energy",
  "finance",
  "default",
] as const;

export default function PptOutlineView({
  id,
  initial,
  onConfirmFill,
  confirming,
}: {
  id: string;
  initial: PptOutlineDraft;
  onConfirmFill?: (draft: PptOutlineDraft) => void;
  confirming?: boolean;
}) {
  const t = useT();
  const [data, setData] = useState(initial);
  const status = useAutosave(id, data);

  function updateSlide(i: number, patch: Partial<PptOutlineSlide>) {
    setData((d) => ({
      ...d,
      slides: d.slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
  }

  function addSlide() {
    setData((d) => ({
      ...d,
      slides: [...d.slides, { layout: "content", title: "", subtitle: "" }],
    }));
  }

  function removeSlide(i: number) {
    setData((d) => ({
      ...d,
      slides: d.slides.filter((_, idx) => idx !== i),
    }));
  }

  return (
    <PanelShell
      icon={<Presentation className="h-4 w-4 text-[var(--mode-accent)]" />}
      title={t("structured.pptOutline.title")}
      actions={<SaveIndicator status={status} />}
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("structured.pptOutline.deckTitle")}
            </span>
            <input
              type="text"
              value={data.title}
              onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-[var(--mode-accent)]/70 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("structured.pptOutline.subtitle")}
            </span>
            <input
              type="text"
              value={data.subtitle}
              onChange={(e) => setData((d) => ({ ...d, subtitle: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-[var(--mode-accent)]/70 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("structured.pptOutline.theme")}
            </span>
            <select
              value={data.themePreset}
              onChange={(e) => setData((d) => ({ ...d, themePreset: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-[var(--mode-accent)]/70 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
            >
              {THEME_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <LayoutTemplate className="h-3.5 w-3.5" />
              {t("structured.pptOutline.slides")}
            </span>
            <button
              type="button"
              onClick={addSlide}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[var(--mode-accent)] hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("structured.pptOutline.addSlide")}
            </button>
          </div>
          <ul className="space-y-2">
            {data.slides.map((slide, i) => (
              <li
                key={i}
                className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/40 sm:grid-cols-[7rem_1fr_1fr_auto]"
              >
                <select
                  value={slide.layout}
                  onChange={(e) => updateSlide(i, { layout: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {LAYOUT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={slide.title}
                  onChange={(e) => updateSlide(i, { title: e.target.value })}
                  placeholder={t("structured.pptOutline.slideTitle")}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  value={slide.subtitle}
                  onChange={(e) => updateSlide(i, { subtitle: e.target.value })}
                  placeholder={t("structured.pptOutline.slideSubtitle")}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => removeSlide(i)}
                  disabled={data.slides.length <= 1}
                  aria-label={t("structured.pptOutline.removeSlide")}
                  className="justify-self-end rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {onConfirmFill && (
          <div className="sticky bottom-0 border-t border-slate-200 bg-white pt-3 dark:border-slate-800 dark:bg-slate-900/60">
            <button
              type="button"
              disabled={confirming || !data.slides.length || !data.title.trim()}
              onClick={() => onConfirmFill(data)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--mode-accent)] px-4 py-2.5 text-sm font-semibold text-white transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {confirming
                ? t("structured.pptOutline.confirming")
                : t("structured.pptOutline.confirm")}
            </button>
            <p className="mt-1.5 text-center text-[11px] text-slate-500 dark:text-slate-400">
              {t("structured.pptOutline.hint")}
            </p>
          </div>
        )}
      </div>
    </PanelShell>
  );
}
