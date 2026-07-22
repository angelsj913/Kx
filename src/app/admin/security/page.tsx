import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSecurityPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";
import { severityColor } from "@/lib/threatRules";
import { ThreatScanButton } from "@/components/admin/ThreatScanButton";

export const dynamic = "force-dynamic";

async function getData() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [loginEvents24h, auditLogs24h, openThreats, threats, lastBackup, aiEnabled] =
    await Promise.all([
      prisma.loginEvent.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.adminAuditLog.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.securityThreatEvent.count({ where: { resolvedAt: null } }),
      prisma.securityThreatEvent.findMany({
        where: { resolvedAt: null },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.backupRecord.findFirst({
        where: { status: "completed" },
        orderBy: { completedAt: "desc" },
      }),
      import("@/lib/aiControl").then((m) => m.isAiGloballyEnabled()),
    ]);
  return { loginEvents24h, auditLogs24h, openThreats, threats, lastBackup, aiEnabled };
}

export default async function SecurityDashboardPage() {
  await requireSecurityPage();
  const s = await getData();

  return (
    <SecurityPageShell title="보안 대시보드" description="보안 상태 현황 · 위험 발생">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ThreatScanButton />
        <Link
          href="/admin/security/threats"
          className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          위험 전체 보기 →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "미해결 위험", value: s.openThreats, href: "/admin/security/threats" },
          { label: "24h 로그인", value: s.loginEvents24h, href: "/admin/security/access/logs" },
          { label: "24h 감사", value: s.auditLogs24h, href: "/admin/security/monitor/events" },
          {
            label: "AI 전역",
            value: s.aiEnabled ? "ON" : "OFF",
            href: "/admin/security/predict",
          },
        ].map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-2xl font-bold tabular-nums">{c.value}</p>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">{c.label}</p>
          </Link>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold">위험 발생 현황</h2>
        <ul className="mt-3 space-y-2">
          {s.threats.length === 0 && (
            <li className="text-sm text-slate-500">현재 미해결 위험이 없습니다. 스캔을 실행해 보세요.</li>
          )}
          {s.threats.map((t) => (
            <li key={t.id}>
              <Link
                href={`/admin/security/threats/${t.id}`}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 p-3 hover:border-blue-300 dark:border-slate-800"
              >
                <div>
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{t.summary}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${severityColor(t.severity)}`}
                >
                  {t.severity}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </SecurityPageShell>
  );
}
