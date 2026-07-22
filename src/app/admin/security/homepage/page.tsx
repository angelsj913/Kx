import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";

export const dynamic = "force-dynamic";

export default async function SecurityHomepagePage() {
  await requireAdminPage();
  const rateLimits = await prisma.rateLimitHit.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const scopes = new Map<string, number>();
  for (const r of rateLimits) {
    scopes.set(r.scope, (scopes.get(r.scope) ?? 0) + r.count);
  }

  return (
    <SecurityPageShell title="홈페이지 보안" description="OTP·인증 rate limit 상태">
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold">scope별 hit 합계 (최근 50행 기준)</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {[...scopes.entries()].map(([scope, count]) => (
            <li key={scope} className="flex justify-between">
              <span className="font-mono text-xs">{scope}</span>
              <span className="tabular-nums">{count}</span>
            </li>
          ))}
          {scopes.size === 0 && <li className="text-slate-500">기록 없음</li>}
        </ul>
      </section>

      <section className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950">
            <tr>
              <th className="px-3 py-2">scope</th>
              <th className="px-3 py-2">identifier</th>
              <th className="px-3 py-2">window</th>
              <th className="px-3 py-2">count</th>
              <th className="px-3 py-2">updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rateLimits.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 font-mono">{r.scope}</td>
                <td className="max-w-[120px] truncate px-3 py-2">{r.identifier}</td>
                <td className="px-3 py-2 font-mono">{r.windowKey}</td>
                <td className="px-3 py-2 tabular-nums">{r.count}</td>
                <td className="px-3 py-2">{new Date(r.updatedAt).toLocaleString("ko-KR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </SecurityPageShell>
  );
}
