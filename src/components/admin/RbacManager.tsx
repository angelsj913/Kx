"use client";

import { useState } from "react";

const ROLES = ["superadmin", "security", "support", "readonly"] as const;

type Admin = { id: string; email: string | null; name: string | null };
type Assignment = { userId: string; role: string };

export function RbacManager({
  admins,
  assignments,
}: {
  admins: Admin[];
  assignments: Assignment[];
}) {
  const [rows, setRows] = useState(assignments);
  const [msg, setMsg] = useState("");

  async function save(userId: string, role: string) {
    const res = await fetch("/api/admin/security/rbac", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (res.ok) {
      setRows((prev) => {
        const next = prev.filter((r) => r.userId !== userId);
        return [...next, { userId, role }];
      });
      setMsg("저장됨");
    }
  }

  return (
    <div className="space-y-3">
      {admins.map((a) => {
        const current = rows.find((r) => r.userId === a.id)?.role ?? "superadmin";
        return (
          <div
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
          >
            <span className="text-sm">{a.email ?? a.name}</span>
            <select
              defaultValue={current}
              onChange={(e) => save(a.id, e.target.value)}
              className="rounded border px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        );
      })}
      {msg && <p className="text-xs text-green-600">{msg}</p>}
    </div>
  );
}
