"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import SecurityBackLink from "./SecurityBackLink";

type Finding = {
  id: string;
  checkId: string;
  severity: string;
  title: string;
  detail: string;
  remediation: string | null;
  result: string;
  status: string;
  waiveReason: string | null;
  skillIds: string[];
  scan: { id: string; createdAt: string; score: number | null };
};

export default function FindingsPageClient() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
      const res = await fetch(`/api/admin/security/findings${q}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "불러오기 실패");
      setFindings(json.findings ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    let waiveReason: string | undefined;
    if (status === "waived") {
      const reason = window.prompt("면제(waive) 사유를 입력하세요");
      if (!reason?.trim()) return;
      waiveReason = reason.trim();
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/security/findings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, waiveReason }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "업데이트 실패");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SecurityBackLink />
          <h1 className="text-xl font-bold">Security Findings</h1>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="open">open</option>
          <option value="acknowledged">acknowledged</option>
          <option value="resolved">resolved</option>
          <option value="waived">waived</option>
          <option value="">전체</option>
        </select>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          불러오는 중…
        </div>
      ) : findings.length === 0 ? (
        <p className="text-sm text-slate-500">해당 상태의 Finding이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {findings.map((f) => (
            <li
              key={f.id}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {f.severity} · {f.result} · {f.checkId} · scan{" "}
                    <Link
                      href={`/admin/security/scans/${f.scan.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {f.scan.id.slice(0, 8)}
                    </Link>
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(["open", "acknowledged", "resolved", "waived"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={busyId === f.id || f.status === s}
                      onClick={() => void setStatus(f.id, s)}
                      className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium disabled:opacity-40 dark:border-slate-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{f.detail}</p>
              {f.remediation && (
                <p className="mt-2 text-xs text-slate-500">조치: {f.remediation}</p>
              )}
              {f.waiveReason && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  Waive: {f.waiveReason}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
