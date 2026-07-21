"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Send } from "lucide-react";
import { useSession } from "next-auth/react";

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

export default function InquiryWorkspaceView() {
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
      setError(data?.error ?? "문의를 접수하지 못했습니다.");
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

  return (
    <div className="h-full overflow-y-auto bg-[var(--workspace-bg)] p-4 sm:p-6">
      <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <section className="rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-surface)] p-5">
          <h1 className="text-lg font-semibold text-[var(--workspace-text)]">1:1 문의</h1>
          <p className="mt-1 text-sm text-[var(--workspace-text-secondary)]">
            계정, 결제, 오류, 기능 요청을 바로 접수하고 답변을 확인하세요.
          </p>
          {sent && <p className="mt-4 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-700">문의가 접수되었습니다.</p>}
          <form className="mt-5 space-y-3" onSubmit={submit}>
            <select name="type" className="w-full rounded-xl border border-[var(--workspace-border)] bg-transparent px-3 py-2.5 text-sm">
              <option value="bug">오류 신고</option>
              <option value="feature">기능 요청</option>
              <option value="account">계정</option>
              <option value="billing">결제</option>
              <option value="etc">기타</option>
            </select>
            <input name="subject" required placeholder="문의 제목" className="w-full rounded-xl border border-[var(--workspace-border)] bg-transparent px-3 py-2.5 text-sm" />
            <textarea name="body" required rows={7} placeholder="상세 내용을 적어 주세요." className="w-full resize-y rounded-xl border border-[var(--workspace-border)] bg-transparent px-3 py-2.5 text-sm" />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
              <Send className="h-4 w-4" /> 문의 보내기
            </button>
          </form>
        </section>
        <section className="rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-surface)] p-5">
          <h2 className="text-sm font-semibold text-[var(--workspace-text)]">내 문의와 답변</h2>
          <div className="mt-3 space-y-2">
            {rows.length === 0 && <p className="py-8 text-center text-sm text-[var(--workspace-text-secondary)]">등록된 문의가 없습니다.</p>}
            {rows.map((row) => {
              const detail = details[row.id];
              const open = openId === row.id;
              return (
                <div key={row.id} className="overflow-hidden rounded-xl border border-[var(--workspace-border)]">
                  <button type="button" onClick={() => void toggle(row)} className="flex w-full items-center justify-between gap-3 p-3 text-left">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{row.subject}</span>
                      <span className="mt-1 block text-[11px] text-[var(--workspace-text-secondary)]">{new Date(row.createdAt).toLocaleDateString("ko-KR")}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass[row.status] ?? statusClass.등록}`}>{row.status}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                    </span>
                  </button>
                  {open && detail && (
                    <div className="space-y-3 border-t border-[var(--workspace-border)] p-3 text-sm">
                      <p className="whitespace-pre-wrap text-[var(--workspace-text-secondary)]">{detail.body}</p>
                      <div className="rounded-lg bg-[var(--workspace-bg)] p-3">
                        <p className="text-xs font-semibold text-blue-600">답변</p>
                        <p className="mt-1 whitespace-pre-wrap text-[var(--workspace-text-secondary)]">{detail.reply ?? "답변을 준비 중입니다."}</p>
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
