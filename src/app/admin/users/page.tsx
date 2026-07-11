import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PLAN_STYLE: Record<string, string> = {
  free: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  pro: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  professional: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
};

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { id: "desc" },
    take: 100,
    include: { settings: { select: { plan: true } } },
  });

  return (
    <div>
      <h1 className="text-xl font-bold">회원</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">가입한 회원과 요금제를 확인합니다.</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-semibold">아이디</th>
              <th className="px-4 py-3 font-semibold">이메일</th>
              <th className="px-4 py-3 font-semibold">전화번호</th>
              <th className="px-4 py-3 font-semibold">요금제</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  회원이 없습니다.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const plan = u.settings?.plan ?? "free";
                return (
                  <tr key={u.id} className="bg-white dark:bg-slate-900">
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                      {u.username ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.email ?? "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{u.phone ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${PLAN_STYLE[plan] ?? PLAN_STYLE["free"]}`}>
                        {plan}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
