"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";

export default function InquiryReply({
  id,
  initialReply,
  initialStatus,
}: {
  id: string;
  initialReply: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [reply, setReply] = useState(initialReply);
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "저장에 실패했습니다.");
      setMsg(data.emailSent ? "저장 및 이메일 발송 완료" : "저장 완료 (이메일 미설정)");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={3}
        placeholder="답변 내용을 입력하세요. 저장하면 문의자 이메일로 발송됩니다."
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500/70 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      />
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-500/70 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
        >
          <option value="등록">등록</option>
          <option value="처리중">처리중</option>
          <option value="답변완료">답변완료</option>
        </select>
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          답변 저장·발송
        </button>
        {msg && <span className="text-xs text-slate-500 dark:text-slate-400">{msg}</span>}
      </div>
    </div>
  );
}
