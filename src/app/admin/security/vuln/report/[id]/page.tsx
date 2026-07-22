import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSecurityPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";

export const dynamic = "force-dynamic";

type Report = {
  findings?: Array<{ name: string; severity: string; title: string }>;
  summary?: Record<string, number>;
};

export default async function VulnReportPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSecurityPage();
  const { id } = await params;
  const scan = await prisma.vulnerabilityScan.findUnique({ where: { id } });
  if (!scan || scan.status !== "completed") notFound();
  const report = (scan.reportJson ?? {}) as Report;

  return (
    <SecurityPageShell title="취약점 분석 보고서" description={scan.fileName ?? scan.id}>
      {report.summary && (
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          {Object.entries(report.summary).map(([k, v]) => (
            <span key={k} className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
              {k}: {v}
            </span>
          ))}
        </div>
      )}
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold">발견 항목</h2>
        <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto text-xs">
          {(report.findings ?? []).map((f, i) => (
            <li key={`${f.name}-${i}`} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-950">
              <span className="font-medium">{f.name}</span>
              <span className="ml-2 text-amber-600">{f.severity}</span>
              <p className="mt-1 text-slate-500">{f.title}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          수정 가이드: npm audit fix 또는 패키지 업그레이드 후 재스캔하세요.
        </p>
      </section>
    </SecurityPageShell>
  );
}
