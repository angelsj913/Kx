import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  failed: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  canceled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

function money(amount: number, currency: string) {
  if (currency.toLowerCase() === "krw") return `₩${amount.toLocaleString("ko-KR")}`;
  return `${amount} ${currency.toUpperCase()}`;
}

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { email: true } } },
  });

  return (
    <div>
      <h1 className="text-xl font-bold">주문·결제</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">발행된 주문과 결제 상태를 확인합니다.</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-semibold">주문번호</th>
              <th className="px-4 py-3 font-semibold">플랜</th>
              <th className="px-4 py-3 font-semibold">금액</th>
              <th className="px-4 py-3 font-semibold">상태</th>
              <th className="px-4 py-3 font-semibold">회원</th>
              <th className="px-4 py-3 font-semibold">일시</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  주문 내역이 없습니다.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="bg-white dark:bg-slate-900">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                    {o.merchantUid}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-700 dark:text-slate-200">{o.plan}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-200">
                    {money(o.amount, o.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[o.status] ?? STATUS_STYLE["pending"]}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {o.user?.email ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
