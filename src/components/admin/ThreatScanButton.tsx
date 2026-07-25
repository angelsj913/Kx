"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ThreatScanButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function scan() {
    setLoading(true);
    try {
      await fetch("/api/admin/security/threats", { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={scan}
      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
    >
      {loading ? "스캔 중…" : "위험 스캔"}
    </button>
  );
}
