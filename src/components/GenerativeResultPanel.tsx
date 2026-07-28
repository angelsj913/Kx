"use client";

import { useT } from "@/lib/i18n";

export type GenerativeMeta = {
  skill: string;
  mode: string;
  route: string;
  summary: string;
  body: string;
};

const SKILL_LABEL_KEYS: Record<string, string> = {
  report: "generative.skill.report",
  presentation: "generative.skill.presentation",
  study: "generative.skill.study",
  inline: "generative.skill.inline",
};

export function parseGenerativeFromResultData(
  resultData?: string | null,
): GenerativeMeta | null {
  if (!resultData) return null;
  try {
    const parsed = JSON.parse(resultData) as { generative?: GenerativeMeta };
    return parsed.generative ?? null;
  } catch {
    return null;
  }
}

export function parseStructuredDataFromResultData(resultData?: string | null): unknown {
  if (!resultData) return null;
  try {
    const parsed = JSON.parse(resultData) as { data?: unknown };
    return parsed.data ?? parsed;
  } catch {
    return null;
  }
}

export function GenerativeResultPanel({
  meta,
  exportBlocked,
}: {
  meta: GenerativeMeta;
  exportBlocked?: boolean;
}) {
  const t = useT();
  const skillKey = SKILL_LABEL_KEYS[meta.skill] ?? "generative.skill.report";
  const skillLabel = t(skillKey);

  return (
    <div className="mb-3 space-y-2 rounded-xl border border-blue-200/80 bg-blue-50/60 px-3 py-2.5 dark:border-blue-900/40 dark:bg-blue-950/30">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-600/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
          {skillLabel}
        </span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400">
          {meta.route.replace("_", " · ")} · {meta.mode}
        </span>
      </div>
      {meta.summary && (
        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{meta.summary}</p>
      )}
      {exportBlocked && (
        <p className="text-[11px] text-amber-700 dark:text-amber-300">{t("generative.export.upgrade")}</p>
      )}
    </div>
  );
}
