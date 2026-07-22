"use client";

import { useState } from "react";

export function AlertSettingsForm({
  initial,
}: {
  initial: { email: string; threshold: string; enabled: boolean };
}) {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/security/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) setSaved(true);
  }

  return (
    <form onSubmit={save} className="max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <label className="block text-sm">
        알림 이메일
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
      </label>
      <label className="block text-sm">
        심각도 임계값
        <select
          value={form.threshold}
          onChange={(e) => setForm({ ...form, threshold: e.target.value })}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="low">low+</option>
          <option value="medium">medium+</option>
          <option value="high">high+</option>
          <option value="critical">critical only</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
        />
        알림 활성화
      </label>
      <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
        저장
      </button>
      {saved && <p className="text-xs text-green-600">저장되었습니다.</p>}
    </form>
  );
}
