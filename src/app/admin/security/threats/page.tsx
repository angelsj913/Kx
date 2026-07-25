import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSecurityPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";
import { severityColor } from "@/lib/threatRules";
import { ThreatScanButton } from "@/components/admin/ThreatScanButton";

export const dynamic = "force-dynamic";

export default async function ThreatsPage() {
  await requireSecurityPage();
  const events = await prisma.securityThreatEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <SecurityPageShell title="위험 발생 현황" description="규칙 기반 탐지 이벤트">
      <ThreatScanButton />
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950">
            <tr>
              <th className="px-3 py-2">시각</th>
              <th className="px-3 py-2">심각도</th>
              <th className="px-3 py-2">제목</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {events.map((e) => (
              <tr key={e.id}>
                <td className="px-3 py-2">{new Date(e.createdAt).toLocaleString("ko-KR")}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${severityColor(e.severity)}`}>
                    {e.severity}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/admin/security/threats/${e.id}`} className="text-blue-600 hover:underline dark:text-blue-400">
                    {e.title}
                  </Link>
                </td>
                <td className="px-3 py-2">{e.resolvedAt ? "해결됨" : "열림"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SecurityPageShell>
  );
}
