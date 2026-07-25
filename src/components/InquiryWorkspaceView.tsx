"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { useT } from "@/lib/i18n";

type Inquiry = {
  id: string;
  type: string;
  subject: string;
  status: string;
  body?: string;
  reply?: string | null;
  createdAt: string;
};

const statusClass: Record<string, string> = {
  등록: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  처리중: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  답변완료: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
};

export default function InquiryWorkspaceView({ embedded = false }: { embedded?: boolean }) {
  const t = useT();
  const { data: session } = useSession();
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, Inquiry>>({});
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/support/inquiry")
      .then((res) => res.json())
      .then((data) => setRows(data.inquiries ?? []))
      .catch(() => {});
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    form.set("email", session?.user?.email ?? "");
    const res = await fetch("/api/support/inquiry", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error ?? t("inquiry.errors.submitFailed"));
      return;
    }
    setSent(true);
    event.currentTarget.reset();
    const refreshed = await fetch("/api/support/inquiry").then((r) => r.json());
    setRows(refreshed.inquiries ?? []);
  }

  async function toggle(row: Inquiry) {
    if (openId === row.id) return setOpenId(null);
    setOpenId(row.id);
    if (details[row.id]) return;
    const res = await fetch(`/api/support/inquiry/${row.id}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.inquiry) setDetails((current) => ({ ...current, [row.id]: data.inquiry }));
  }

  const shellClass = embedded
    ? "space-y-5"
    : "h-full overflow-y-auto bg-[var(--workspace-bg)] p-4 sm:p-6";

  const gridClass = embedded
    ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.75fr)]"
    : "mx-auto grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]";

  return (
    <div className={shellClass}>
      <div className={gridClass}>
        <section
          className={`rounded-2xl border p-5 ${
            embedded
              ? "border-slate-200 dark:border-slate-700"
              : "border-[var(--workspace-border)] bg-[var(--workspace-surface)]"
          }`}
        >
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t("inquiry.title")}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("inquiry.subtitle")}</p>
          {sent && (
            <p className="mt-4 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              {t("inquiry.sent")}
            </p>
          )}
          <form className="mt-5 space-y-3" onSubmit={submit}>
            <select
              name="type"
              className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2.5 text-sm dark:border-slate-700"
            >
              <option value="bug">{t("inquiry.type.bug")}</option>
              <option value="feature">{t("inquiry.type.feature")}</option>
              <option value="account">{t("inquiry.type.account")}</option>
              <option value="billing">{t("inquiry.type.billing")}</option>
              <option value="etc">{t("inquiry.type.etc")}</option>
            </select>
            <input
              name="subject"
              required
              placeholder={t("inquiry.subjectPlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2.5 text-sm dark:border-slate-700"
            />
            <textarea
              name="body"
              required
              rows={embedded ? 5 : 7}
              placeholder={t("inquiry.bodyPlaceholder")}
              className="w-full resize-y rounded-xl border border-slate-200 bg-transparent px-3 py-2.5 text-sm dark:border-slate-700"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <Send className="h-4 w-4" />
              {t("inquiry.submit")}
            </button>
          </form>
        </section>

        <section
          className={`rounded-2xl border p-5 ${
            embedded
              ? "border-slate-200 dark:border-slate-700"
              : "border-[var(--workspace-border)] bg-[var(--workspace-surface)]"
          }`}
        >
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{t("inquiry.history")}</h2>
          <div className="mt-3 space-y-2">
            {rows.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">{t("inquiry.empty")}</p>
            )}
            {rows.map((row) => {
              const detail = details[row.id];
              const open = openId === row.id;
              return (
                <div key={row.id} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => void toggle(row)}
                    className="flex w-full items-center justify-between gap-3 p-3 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{row.subject}</span>
                      <span className="mt-1 block text-[11px] text-slate-500">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass[row.status] ?? statusClass.등록}`}
                      >
                        {row.status}
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                    </span>
                  </button>
                  {open && detail && (
                    <div className="space-y-3 border-t border-slate-200 p-3 text-sm dark:border-slate-700">
                      <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-300">{detail.body}</p>
                      <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/50">
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{t("inquiry.replyLabel")}</p>
                        <p className="mt-1 whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                          {detail.reply ?? t("inquiry.replyPending")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
