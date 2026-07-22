import { prisma } from "@/lib/prisma";
import { requireSecurityPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";

export const dynamic = "force-dynamic";

export default async function MonitorTrafficPage() {
  await requireSecurityPage();
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const [rateLimits, recentLogins] = await Promise.all([
    prisma.rateLimitHit.findMany({
      where: { updatedAt: { gte: hourAgo } },
      orderBy: { count: "desc" },
      take: 30,
    }),
    prisma.loginEvent.findMany({
      where: { createdAt: { gte: hourAgo }, ip: { not: null } },
      select: { ip: true },
    }),
  ]);

  const ipCounts = new Map<string, number>();
  for (const l of recentLogins) {
    const ip = l.ip!;
    ipCounts.set(ip, (ipCounts.get(ip) ?? 0) + 1);
  }
  const loginByIp = [...ipCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([ip, count]) => ({ ip, count }));

  return (
    <SecurityPageShell title="네트워크 트래픽 분석" description="앱 레벨 rate limit · 로그인 패턴">
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold">Rate limit (1h)</h2>
        <ul className="mt-3 space-y-1 text-xs">
          {rateLimits.map((r) => (
            <li key={r.id} className="flex justify-between">
              <span>{r.scope} · {r.identifier.slice(0, 24)}</span>
              <span className="tabular-nums font-medium">{r.count}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold">IP별 로그인 (1h)</h2>
        <ul className="mt-3 space-y-1 text-xs">
          {loginByIp.map((r) => (
            <li key={r.ip} className="flex justify-between">
              <span className="font-mono">{r.ip}</span>
              <span>{r.count}</span>
            </li>
          ))}
        </ul>
      </section>
    </SecurityPageShell>
  );
}
