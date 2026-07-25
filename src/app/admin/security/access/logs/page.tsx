import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSecurityPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";

export const dynamic = "force-dynamic";

export default async function AccessLogsPage() {
  await requireSecurityPage();
  const events = await prisma.loginEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { email: true, name: true } } },
  });

  return (
    <SecurityPageShell title="접근 로그 조회" description="LoginEvent · 비정상 접근은 위험 탭에서">
      <a
        href="/api/admin/security/events/export?type=login"
        className="mb-4 inline-block rounded-lg border px-3 py-1.5 text-xs font-medium"
      >
        CSV 내보내기
      </a>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950">
            <tr>
              <th className="px-3 py-2 text-left">시각</th>
              <th className="px-3 py-2 text-left">사용자</th>
              <th className="px-3 py-2 text-left">IP</th>
              <th className="px-3 py-2 text-left">provider</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-2">{new Date(e.createdAt).toLocaleString("ko-KR")}</td>
                <td className="px-3 py-2">{e.user.email ?? e.user.name}</td>
                <td className="px-3 py-2 font-mono">{e.ip ?? "—"}</td>
                <td className="px-3 py-2">{e.provider ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link href="/admin/security/access" className="mt-4 inline-block text-xs text-blue-600 hover:underline">
        ← 접근 제어
      </Link>
    </SecurityPageShell>
  );
}
