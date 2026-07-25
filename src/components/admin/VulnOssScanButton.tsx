"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function VulnOssScanButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/security/vuln", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "스캔 실패");
      router.push(`/admin/security/vuln/report/${data.id}`);
      router.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={loading}
        onClick={run}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "분석 중…" : "AI 분석 요청 (OSS)"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
