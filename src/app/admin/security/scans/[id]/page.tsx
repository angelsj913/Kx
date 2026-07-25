import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminSecurityScanDetailPage({ params }: Props) {
  const { id } = await params;
  const scan = await prisma.securityScan.findUnique({
    where: { id },
    include: { findings: { orderBy: [{ result: "asc" }, { severity: "asc" }] } },
  });
  if (!scan) notFound();

  let summary: Record<string, unknown> | null = null;
  try {
    summary = scan.summaryJson ? (JSON.parse(scan.summaryJson) as Record<string, unknown>) : null;
  } catch {
    summary = null;
  }

  return (
    <div className="space-y-4">
      <Link
        href="/admin/security"
        className="text-xs text-slate-500 hover:text-blue-600"
      >
        ← 보안 대시보드
      </Link>
      <h1 className="text-xl font-bold">스캔 상세</h1>
      <p className="text-sm text-slate-500">
        {scan.id} · {scan.status} · 점수 {scan.score ?? "—"} ·{" "}
        {new Date(scan.createdAt).toLocaleString()}
      </p>
      {scan.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {scan.error}
        </p>
      )}
      {summary && (
        <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
          {JSON.stringify(summary, null, 2)}
        </pre>
      )}

      <div className="flex flex-wrap gap-2">
        <a
          href={`/api/admin/security/scans/${scan.id}/export?format=json`}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
        >
          JSON 다운로드
        </a>
        <a
          href={`/api/admin/security/scans/${scan.id}/export?format=md`}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
        >
          Markdown 다운로드
        </a>
      </div>

      <ul className="space-y-2">
        {scan.findings.map((f) => (
          <li
            key={f.id}
            className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="font-semibold">
              [{f.result}] {f.title}{" "}
              <span className="text-xs font-normal text-slate-500">
                {f.severity} · {f.status}
              </span>
            </p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">{f.detail}</p>
            {f.remediation && (
              <p className="mt-1 text-xs text-slate-500">조치: {f.remediation}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
