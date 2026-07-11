"use client";

import { Download } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";
import { WINDOWS_DOWNLOAD_URL, MAC_DOWNLOAD_URL, ALL_RELEASES_URL } from "@/lib/constants";
import SupportShell from "@/components/support/SupportShell";

export default function SupportReleasesPage() {
  const t = useLandingT();

  return (
    <SupportShell active="releases">
      <h1 className="mb-5 text-xl font-bold sm:text-2xl">{t("support.tab.legacy")}</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">{t("support.legacy.desc")}</p>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {t("support.legacy.current")}
        </p>
        <a
          href={WINDOWS_DOWNLOAD_URL}
          download
          className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition-colors duration-300 hover:border-blue-400/60 hover:text-blue-700 dark:border-slate-800 dark:text-slate-200 dark:hover:border-blue-500/60 dark:hover:text-blue-300"
        >
          Windows <Download className="h-4 w-4" />
        </a>
        <a
          href={MAC_DOWNLOAD_URL}
          download
          className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition-colors duration-300 hover:border-blue-400/60 hover:text-blue-700 dark:border-slate-800 dark:text-slate-200 dark:hover:border-blue-500/60 dark:hover:text-blue-300"
        >
          macOS <Download className="h-4 w-4" />
        </a>
      </div>

      <div className="mt-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {t("support.legacy.archive")}
        </p>
        <a
          href={ALL_RELEASES_URL}
          className="block break-all rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 transition-colors duration-300 hover:border-blue-400/60 hover:text-blue-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-500/60 dark:hover:text-blue-300"
        >
          {ALL_RELEASES_URL}
        </a>
        <p className="text-xs text-slate-400 dark:text-slate-500">{t("support.legacy.archiveNote")}</p>
      </div>
    </SupportShell>
  );
}
