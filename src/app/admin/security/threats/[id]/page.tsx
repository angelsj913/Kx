import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSecurityPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";
import { severityColor } from "@/lib/threatRules";
import { ResolveThreatButton } from "@/components/admin/ResolveThreatButton";

export const dynamic = "force-dynamic";

export default async function ThreatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSecurityPage();
  const { id } = await params;
  const event = await prisma.securityThreatEvent.findUnique({ where: { id } });
  if (!event) notFound();

  return (
    <SecurityPageShell title="위험 상세" description={event.type}>
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{event.title}</h2>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${severityColor(event.severity)}`}>
            {event.severity}
          </span>
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{event.summary}</p>
        <dl className="mt-4 grid gap-2 text-xs text-slate-500">
          <div>발생: {new Date(event.createdAt).toLocaleString("ko-KR")}</div>
          {event.source && <div>출처: {event.source}</div>}
          {event.resolvedAt && <div>해결: {new Date(event.resolvedAt).toLocaleString("ko-KR")}</div>}
        </dl>
        {!event.resolvedAt && <ResolveThreatButton id={event.id} />}
      </div>
    </SecurityPageShell>
  );
}
