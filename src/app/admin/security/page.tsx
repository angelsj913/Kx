import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";
import { isAiGloballyEnabled, getAiDailyRequestCap } from "@/lib/aiControl";

export const dynamic = "force-dynamic";

async function getSummary() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [
    loginEvents24h,
    auditLogs24h,
    users,
    workspaces,
    memories,
    learnedQa,
    chunks,
    lastBackup,
    aiEnabled,
    dailyCap,
  ] = await Promise.all([
    prisma.loginEvent.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.adminAuditLog.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.user.count(),
    prisma.workspace.count(),
    prisma.userMemory.count(),
    prisma.learnedQaPair.count(),
    prisma.documentChunk.count(),
    prisma.backupRecord.findFirst({
      where: { status: "completed" },
      orderBy: { completedAt: "desc" },
    }),
    isAiGloballyEnabled(),
    getAiDailyRequestCap(),
  ]);

  return {
    loginEvents24h,
    auditLogs24h,
    users,
    workspaces,
    memories,
    learnedQa,
    chunks,
    lastBackup,
    aiEnabled,
    dailyCap,
  };
}

export default async function SecurityDashboardPage() {
  await requireAdminPage();
  const s = await getSummary();

  const cards = [
    { label: "24h 로그인", value: s.loginEvents24h, href: "/admin/security/auth" },
    { label: "24h 감사 로그", value: s.auditLogs24h, href: "/admin/security/activity" },
    { label: "전체 회원", value: s.users, href: "/admin/users" },
    { label: "워크스페이스", value: s.workspaces, href: "/admin/security/workspace" },
    { label: "메모리", value: s.memories, href: "/admin/security/ai-learning" },
    { label: "학습 Q&A", value: s.learnedQa, href: "/admin/security/ai-learning" },
    { label: "RAG 청크", value: s.chunks, href: "/admin/security/ai-learning" },
  ];

  return (
    <SecurityPageShell title="보안·백업 콘솔" description="로그인·AI·학습·백업을 관리자만 열람합니다.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-400/60 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-2xl font-bold tabular-nums">{c.value}</p>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold">시스템 상태</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>AI 전역: {s.aiEnabled ? "활성" : "비활성 (kill switch)"}</li>
            <li>일일 AI 상한: {s.dailyCap ?? "무제한"}</li>
            <li>
              마지막 백업:{" "}
              {s.lastBackup?.completedAt
                ? new Date(s.lastBackup.completedAt).toLocaleString("ko-KR")
                : "없음"}
            </li>
          </ul>
          <Link
            href="/admin/security/backup"
            className="mt-4 inline-block text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            백업 관리 →
          </Link>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold">빠른 링크</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/admin/security/live" className="text-blue-600 hover:underline dark:text-blue-400">
                실시간 활동 피드
              </Link>
            </li>
            <li>
              <Link href="/admin/security/system" className="text-blue-600 hover:underline dark:text-blue-400">
                시스템 설정·cron
              </Link>
            </li>
            <li>
              <Link href="/admin/ai" className="text-blue-600 hover:underline dark:text-blue-400">
                AI 관리 패널
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </SecurityPageShell>
  );
}
