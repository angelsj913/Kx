import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";

export const dynamic = "force-dynamic";

export default async function SecurityWorkspacePage() {
  await requireAdminPage();
  const [workspaces, members, pendingInvites] = await Promise.all([
    prisma.workspace.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        owner: { select: { email: true } },
        _count: { select: { members: true, libraryItems: true, chatSessions: true } },
      },
    }),
    prisma.workspaceMember.count(),
    prisma.workspaceInvite.count({ where: { acceptedAt: null, expiresAt: { gt: new Date() } } }),
  ]);

  return (
    <SecurityPageShell title="워크스페이스" description="팀·초대·삭제 정책 모니터링">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-2xl font-bold">{workspaces.length}+</p>
          <p className="text-xs text-slate-500">최근 워크스페이스</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-2xl font-bold">{members}</p>
          <p className="text-xs text-slate-500">전체 멤버십</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-2xl font-bold">{pendingInvites}</p>
          <p className="text-xs text-slate-500">대기 중 초대</p>
        </div>
      </div>

      <section className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950">
            <tr>
              <th className="px-3 py-2">이름</th>
              <th className="px-3 py-2">소유자</th>
              <th className="px-3 py-2">멤버</th>
              <th className="px-3 py-2">세션</th>
              <th className="px-3 py-2">서재</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {workspaces.map((w) => (
              <tr key={w.id}>
                <td className="px-3 py-2 font-medium">{w.name}</td>
                <td className="px-3 py-2">{w.owner.email ?? "—"}</td>
                <td className="px-3 py-2 tabular-nums">{w._count.members}</td>
                <td className="px-3 py-2 tabular-nums">{w._count.chatSessions}</td>
                <td className="px-3 py-2 tabular-nums">{w._count.libraryItems}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </SecurityPageShell>
  );
}
