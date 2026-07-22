import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSecurityPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";

export const dynamic = "force-dynamic";

export default async function MonitorEventsPage() {
  await requireSecurityPage();
  const [audits, logins] = await Promise.all([
    prisma.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.loginEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { email: true } } },
    }),
  ]);

  return (
    <SecurityPageShell title="보안 이벤트 로그" description="AdminAuditLog · LoginEvent">
      <div className="mb-4 flex gap-2">
        <a
          href="/api/admin/security/events/export?type=all"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:border-slate-700"
        >
          CSV 내보내기
        </a>
        <Link href="/admin/security/monitor" className="text-xs text-blue-600 hover:underline">
          ← 모니터링
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <h2 className="border-b px-3 py-2 text-sm font-semibold dark:border-slate-800">감사 로그</h2>
          <table className="min-w-full text-xs">
            <tbody>
              {audits.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-2">{new Date(a.createdAt).toLocaleString("ko-KR")}</td>
                  <td className="px-3 py-2">{a.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <h2 className="border-b px-3 py-2 text-sm font-semibold dark:border-slate-800">로그인</h2>
          <table className="min-w-full text-xs">
            <tbody>
              {logins.map((l) => (
                <tr key={l.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-2">{l.user.email ?? l.userId.slice(0, 8)}</td>
                  <td className="px-3 py-2">{l.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </SecurityPageShell>
  );
}
