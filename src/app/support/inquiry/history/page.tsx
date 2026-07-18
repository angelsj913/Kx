"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";
import SupportShell from "@/components/support/SupportShell";

interface InquiryRow {
  id: string;
  type: string;
  subject: string;
  status: string;
  createdAt: string;
}

interface InquiryDetail extends InquiryRow {
  body: string;
  reply: string | null;
  fileUrl: string | null;
  fileName: string | null;
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
  const [openId, setOpenId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, InquiryDetail>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

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

  async function toggle(id: string) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (!details[id]) {
      setDetailLoading(id);
      try {
        const res = await fetch(`/api/support/inquiry/${id}`);
        const data = await res.json();
        if (res.ok && data.inquiry) {
          setDetails((prev) => ({ ...prev, [id]: data.inquiry }));
        }
      } catch {
        /* ignore — 다시 눌러 재시도 가능 */
      } finally {
        setDetailLoading(null);
      }
    }
  }

  return (
    <SupportShell active="history">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold sm:text-2xl">{t("support.nav.history")}</h1>
        <Link
          href="/support/inquiry"
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
          {rows.map((row) => {
            const isOpen = openId === row.id;
            const detail = details[row.id];
            return (
              <li
                key={row.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <button
                  type="button"
                  onClick={() => toggle(row.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {row.subject}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {new Date(row.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={row.status} />
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 px-4 py-4 dark:border-slate-800">
                    {detailLoading === row.id && !detail ? (
                      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                        {t("support.inquiry.detail.loading")}
                      </p>
                    ) : detail ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                            {t("support.inquiry.detail.question")}
                          </p>
                          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                            {detail.body}
                          </p>
                          {detail.fileUrl && (
                            <a
                              href={detail.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {t("support.inquiry.detail.attachment")}: {detail.fileName}
                            </a>
                          )}
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/50">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                            {t("support.inquiry.detail.answer")}
                          </p>
                          {detail.reply ? (
                            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                              {detail.reply}
                            </p>
                          ) : (
                            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                              {t("support.inquiry.detail.pending")}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                        {t("support.inquiry.detail.loading")}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SupportShell>
  );
}
