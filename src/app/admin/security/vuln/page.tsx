import Link from "next/link";
import { requireSecurityPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";
import { VulnOssScanButton } from "@/components/admin/VulnOssScanButton";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VulnHubPage() {
  await requireSecurityPage();
  const scans = await prisma.vulnerabilityScan.findMany({
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  return (
    <SecurityPageShell title="AI 코드 취약점 검토" description="OSS 라이브러리 · 의존성 분석">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold">오픈소스 라이브러리 검토</h2>
          <p className="mt-2 text-xs text-slate-500">npm audit로 package-lock.json 의존성 CVE를 검사합니다.</p>
          <VulnOssScanButton />
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold">코드 등록 (예정)</h2>
          <p className="mt-2 text-xs text-slate-500">
            ZIP 업로드 + LLM 정적 분석은 Phase 2b에서 추가됩니다. 현재는 OSS 스캔을 사용하세요.
          </p>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold">스캔 이력</h2>
        <ul className="mt-3 space-y-2 text-xs">
          {scans.map((s) => (
            <li key={s.id} className="flex justify-between border-b border-slate-100 py-2 dark:border-slate-800">
              <span>
                {s.trigger} · {s.status} · {s.fileName ?? "—"}
              </span>
              <span>{new Date(s.startedAt).toLocaleString("ko-KR")}</span>
            </li>
          ))}
          {scans.length === 0 && <li className="text-slate-500">아직 스캔 없음</li>}
        </ul>
        {scans[0]?.reportJson && (
          <Link
            href={`/admin/security/vuln/report/${scans[0].id}`}
            className="mt-3 inline-block text-xs text-blue-600 hover:underline"
          >
            최근 보고서 보기 →
          </Link>
        )}
      </section>
    </SecurityPageShell>
  );
}
