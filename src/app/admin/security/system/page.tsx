import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";
import { isAiGloballyEnabled, getAiDailyRequestCap } from "@/lib/aiControl";

export const dynamic = "force-dynamic";

export default async function SecuritySystemPage() {
  await requireAdminPage();
  const [configs, globalCounters, aiEnabled, dailyCap] = await Promise.all([
    prisma.systemConfig.findMany({ orderBy: { key: "asc" } }),
    prisma.globalCounter.findMany({ orderBy: { updatedAt: "desc" }, take: 20 }),
    isAiGloballyEnabled(),
    getAiDailyRequestCap(),
  ]);

  return (
    <SecurityPageShell title="시스템" description="AI kill switch · SystemConfig · cron 카운터">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold">AI 전역</p>
          <p className="mt-2 text-lg">{aiEnabled ? "활성" : "비활성"}</p>
          <p className="mt-1 text-xs text-slate-500">일일 상한: {dailyCap ?? "무제한"}</p>
          <a href="/admin/ai" className="mt-3 inline-block text-xs text-blue-600 hover:underline dark:text-blue-400">
            AI 관리에서 변경 →
          </a>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold">cron / Vercel</p>
          <p className="mt-2 text-xs text-slate-500">
            휴면·피드백 집계 등은 vercel.json cron으로 실행됩니다.
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold">SystemConfig</h2>
        <ul className="mt-3 space-y-2 font-mono text-xs">
          {configs.map((c) => (
            <li key={c.key} className="flex flex-wrap gap-2 border-b border-slate-100 py-2 dark:border-slate-800">
              <span className="font-semibold text-blue-600 dark:text-blue-400">{c.key}</span>
              <span className="break-all text-slate-600 dark:text-slate-300">{c.value}</span>
            </li>
          ))}
          {configs.length === 0 && <li className="text-slate-500">설정 없음</li>}
        </ul>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold">GlobalCounter</h2>
        <ul className="mt-3 space-y-1 text-xs">
          {globalCounters.map((g) => (
            <li key={g.id} className="flex justify-between">
              <span>{g.feature} · {g.periodKey}</span>
              <span className="tabular-nums">{g.count}</span>
            </li>
          ))}
        </ul>
      </section>
    </SecurityPageShell>
  );
}
