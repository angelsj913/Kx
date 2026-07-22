import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";

export const dynamic = "force-dynamic";

export default async function SecurityActivityPage() {
  await requireAdminPage();
  const logs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <SecurityPageShell title="활동 감사" description="AdminAuditLog append-only">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-950">
            <tr>
              <th className="px-3 py-2 font-medium">시각</th>
              <th className="px-3 py-2 font-medium">관리자</th>
              <th className="px-3 py-2 font-medium">action</th>
              <th className="px-3 py-2 font-medium">target</th>
              <th className="px-3 py-2 font-medium">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  아직 감사 로그가 없습니다.
                </td>
              </tr>
            )}
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                  {new Date(l.createdAt).toLocaleString("ko-KR")}
                </td>
                <td className="px-3 py-2">{l.adminEmail ?? l.adminId ?? "—"}</td>
                <td className="px-3 py-2 font-medium">{l.action}</td>
                <td className="px-3 py-2">{l.target ?? "—"}</td>
                <td className="px-3 py-2 font-mono">{l.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SecurityPageShell>
  );
}
