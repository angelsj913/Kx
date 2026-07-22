import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";

export const dynamic = "force-dynamic";

export default async function SecurityAuthPage() {
  await requireAdminPage();
  const events = await prisma.loginEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { email: true, name: true } } },
  });

  return (
    <SecurityPageShell title="로그인·가입" description="LoginEvent 최근 100건">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-950">
            <tr>
              <th className="px-3 py-2 font-medium">시각</th>
              <th className="px-3 py-2 font-medium">사용자</th>
              <th className="px-3 py-2 font-medium">provider</th>
              <th className="px-3 py-2 font-medium">IP</th>
              <th className="px-3 py-2 font-medium">UA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {events.map((e) => (
              <tr key={e.id}>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                  {new Date(e.createdAt).toLocaleString("ko-KR")}
                </td>
                <td className="px-3 py-2">{e.user.email ?? e.user.name ?? e.userId.slice(0, 8)}</td>
                <td className="px-3 py-2">{e.provider ?? "—"}</td>
                <td className="px-3 py-2 font-mono">{e.ip ?? "—"}</td>
                <td className="max-w-xs truncate px-3 py-2" title={e.userAgent ?? ""}>
                  {e.userAgent ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SecurityPageShell>
  );
}
