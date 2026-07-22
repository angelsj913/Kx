import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSecurityPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";

export const dynamic = "force-dynamic";

export default async function AccessUsersPage() {
  await requireSecurityPage();
  const users = await prisma.user.findMany({
    orderBy: { id: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      email: true,
      accountStatus: true,
      settings: { select: { plan: true, aiDisabled: true } },
    },
  });

  return (
    <SecurityPageShell title="사용자 계정 관리" description="조회 · /admin/users에서 요금제 변경">
      <Link href="/admin/users" className="mb-4 inline-block text-xs text-blue-600 hover:underline">
        전체 회원 관리 →
      </Link>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950">
            <tr>
              <th className="px-3 py-2 text-left">이메일</th>
              <th className="px-3 py-2 text-left">plan</th>
              <th className="px-3 py-2 text-left">상태</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-2">{u.email ?? u.name}</td>
                <td className="px-3 py-2">{u.settings?.plan ?? "free"}</td>
                <td className="px-3 py-2">{u.accountStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SecurityPageShell>
  );
}
