import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";
import { monthKey } from "@/lib/usage";

export const dynamic = "force-dynamic";

export default async function SecurityAiUsagePage() {
  await requireAdminPage();
  const mk = monthKey();
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [messages24h, messages7d, topUsage, byModel] = await Promise.all([
    prisma.chatHistory.count({ where: { createdAt: { gte: dayAgo }, role: "model" } }),
    prisma.chatHistory.count({ where: { createdAt: { gte: weekAgo }, role: "model" } }),
    prisma.usageCounter.findMany({
      where: { periodKey: mk },
      orderBy: { count: "desc" },
      take: 20,
      include: { user: { select: { email: true, name: true } } },
    }),
    prisma.chatHistory.groupBy({
      by: ["modelName"],
      where: { role: "model", createdAt: { gte: weekAgo }, modelName: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { modelName: "desc" } },
      take: 15,
    }),
  ]);

  return (
    <SecurityPageShell title="AI 사용량" description="모델·기능별 집계">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-2xl font-bold tabular-nums">{messages24h}</p>
          <p className="text-xs text-slate-500">24h 모델 응답</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-2xl font-bold tabular-nums">{messages7d}</p>
          <p className="text-xs text-slate-500">7d 모델 응답</p>
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold">모델별 (7d)</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {byModel.map((m) => (
            <li key={m.modelName ?? "unknown"} className="flex justify-between">
              <span>{m.modelName ?? "unknown"}</span>
              <span className="tabular-nums text-slate-500">{m._count._all}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold dark:border-slate-800">
          이번 달 상위 사용 ({mk})
        </h2>
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950">
            <tr>
              <th className="px-3 py-2">사용자</th>
              <th className="px-3 py-2">feature</th>
              <th className="px-3 py-2">count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {topUsage.map((u) => (
              <tr key={u.id}>
                <td className="px-3 py-2">{u.user.email ?? u.user.name ?? u.userId}</td>
                <td className="px-3 py-2">{u.feature}</td>
                <td className="px-3 py-2 tabular-nums">{u.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </SecurityPageShell>
  );
}
