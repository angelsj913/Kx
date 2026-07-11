"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLandingT } from "@/lib/landingI18n";
import SupportShell from "@/components/support/SupportShell";

interface InquiryRow {
  id: string;
  type: string;
  subject: string;
  status: string;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const t = useLandingT();
  const map: Record<string, { labelKey: Parameters<typeof t>[0]; cls: string }> = {
    등록: {
      labelKey: "support.inquiry.status.registered",
      cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    },
    처리중: {
      labelKey: "support.inquiry.status.processing",
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    },
    답변완료: {
      labelKey: "support.inquiry.status.answered",
      cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    },
  };
  const s = map[status] ?? map["등록"];
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>
      {t(s.labelKey)}
    </span>
  );
}

export default function InquiryHistoryPage() {
  const t = useLandingT();
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [state, setState] = useState<"loading" | "unauth" | "ready">("loading");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/support/inquiry");
        if (res.status === 401) {
          setState("unauth");
          return;
        }
        const data = await res.json();
        setRows(data.inquiries ?? []);
        setState("ready");
      } catch {
        setState("ready");
      }
    })();
  }, []);

  return (
    <SupportShell active="history">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold sm:text-2xl">{t("support.nav.history")}</h1>
        <Link
          href="/support/inquiry"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
        >
          {t("support.tab.inquiry")}
        </Link>
      </div>

      {state === "loading" && (
        <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
          {t("support.inquiry.history.loading")}
        </p>
      )}

      {state === "unauth" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-300">{t("support.inquiry.history.loginRequired")}</p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            {t("header.login")}
          </Link>
        </div>
      )}

      {state === "ready" && rows.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {t("support.inquiry.history.empty")}
        </p>
      )}

      {state === "ready" && rows.length > 0 && (
        <ul className="space-y-2.5">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {row.subject}
                </p>
                <StatusBadge status={row.status} />
              </div>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {new Date(row.createdAt).toLocaleDateString("ko-KR")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </SupportShell>
  );
}
