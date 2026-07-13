import Link from "next/link";
import {
  MessageSquare,
  CreditCard,
  Users,
  Clock,
  MessageCircle,
  Activity,
  Layers,
  Crown,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getStats() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    users,
    chatSessions,
    chatSessionsWeek,
    chatMessages,
    chatMessagesWeek,
    orders,
    paidOrders,
    inquiries,
    openInquiries,
    planGroups,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.chatSession.count(),
    prisma.chatSession.count({ where: { updatedAt: { gte: weekAgo } } }),
    prisma.chatHistory.count(),
    prisma.chatHistory.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "paid" } }),
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { status: { not: "답변완료" } } }),
    prisma.userSettings.groupBy({
      by: ["plan"],
      _count: { plan: true },
    }),
    prisma.user.findMany({
      orderBy: { id: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        settings: { select: { plan: true } },
        _count: { select: { chatSessions: true } },
      },
    }),
  ]);

  // User 모델에 createdAt 없으면 세션 활동 기준으로 대체
  let activeUsers24h = 0;
  let activeUsers7d = 0;
  try {
    const [a24, a7] = await Promise.all([
      prisma.chatSession.findMany({
        where: { updatedAt: { gte: dayAgo } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.chatSession.findMany({
        where: { updatedAt: { gte: weekAgo } },
        select: { userId: true },
        distinct: ["userId"],
      }),
    ]);
    activeUsers24h = a24.length;
    activeUsers7d = a7.length;
  } catch {
    /* ignore */
  }

  const plans: Record<string, number> = { free: 0, pro: 0, professional: 0 };
  for (const g of planGroups) {
    const key = (g.plan || "free").toLowerCase();
    plans[key] = (plans[key] ?? 0) + g._count.plan;
  }
  // settings 없는 유저는 free로 간주
  const withSettings = Object.values(plans).reduce((a, b) => a + b, 0);
  if (users > withSettings) {
    plans.free = (plans.free ?? 0) + (users - withSettings);
  }

  return {
    users,
    usersLast24h: activeUsers24h,
    usersLast7d: activeUsers7d,
    chatSessions,
    chatSessionsWeek,
    chatMessages,
    chatMessagesWeek,
    orders,
    paidOrders,
    inquiries,
    openInquiries,
    plans,
    recentUsers,
  };
}

export default async function AdminDashboard() {
  const s = await getStats();

  const cards = [
    {
      label: "전체 회원",
      value: s.users,
      sub: "가입된 계정 수",
      icon: Users,
      href: "/admin/users",
      accent: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "오늘 활성 사용자",
      value: s.usersLast24h,
      sub: "최근 24시간 채팅 활동",
      icon: Activity,
      href: "/admin/users",
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "7일 활성 사용자",
      value: s.usersLast7d,
      sub: "최근 7일 채팅 활동",
      icon: Users,
      href: "/admin/users",
      accent: "text-indigo-600 dark:text-indigo-400",
    },
    {
      label: "대화 세션",
      value: s.chatSessions,
      sub: `이번 주 활동 ${s.chatSessionsWeek}`,
      icon: MessageCircle,
      href: "/admin/users",
      accent: "text-violet-600 dark:text-violet-400",
    },
    {
      label: "메시지 수",
      value: s.chatMessages,
      sub: `이번 주 ${s.chatMessagesWeek}`,
      icon: Layers,
      href: "/admin/users",
      accent: "text-cyan-600 dark:text-cyan-400",
    },
    {
      label: "미답변 문의",
      value: s.openInquiries,
      sub: `전체 문의 ${s.inquiries}`,
      icon: Clock,
      href: "/admin/inquiries",
      accent: "text-rose-600 dark:text-rose-400",
    },
    {
      label: "결제 완료",
      value: `${s.paidOrders} / ${s.orders}`,
      sub: "유료 주문 / 전체 주문",
      icon: CreditCard,
      href: "/admin/orders",
      accent: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "유료 플랜 회원",
      value: (s.plans.pro ?? 0) + (s.plans.professional ?? 0),
      sub: `Pro ${s.plans.pro ?? 0} · Prof ${s.plans.professional ?? 0}`,
      icon: Crown,
      href: "/admin/users",
      accent: "text-yellow-600 dark:text-yellow-400",
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold">관리자 대시보드</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        ZEFF AI 사용 현황 · 관리자 계정만 접근할 수 있습니다.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, sub, icon: Icon, href, accent }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-400/60 dark:border-slate-800 dark:bg-slate-900"
          >
            <Icon className={`h-5 w-5 ${accent}`} />
            <p className="mt-3 text-2xl font-bold tabular-nums">{value}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-700 dark:text-slate-200">{label}</p>
            {sub && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{sub}</p>}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">요금제 분포</h2>
          <ul className="mt-4 space-y-3">
            {(
              [
                { id: "free", label: "free", n: s.plans.free ?? 0 },
                { id: "pro", label: "Pro", n: s.plans.pro ?? 0 },
                { id: "professional", label: "Professional", n: s.plans.professional ?? 0 },
              ] as const
            ).map((p) => {
              const pct = s.users > 0 ? Math.round((p.n / s.users) * 100) : 0;
              return (
                <li key={p.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{p.label}</span>
                    <span className="tabular-nums text-slate-500">
                      {p.n}명 · {pct}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        p.id === "free"
                          ? "bg-slate-400"
                          : p.id === "pro"
                            ? "bg-blue-500"
                            : "bg-indigo-500"
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">최근 회원</h2>
            <Link href="/admin/users" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
              전체 보기
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {s.recentUsers.length === 0 && (
              <li className="py-6 text-center text-sm text-slate-500">아직 회원이 없습니다.</li>
            )}
            {s.recentUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {u.name || u.username || u.email || u.id.slice(0, 8)}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">{u.email ?? "—"}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] font-medium uppercase text-slate-500">
                    {u.settings?.plan ?? "free"}
                  </p>
                  <p className="text-[11px] text-slate-400">세션 {u._count.chatSessions}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className="mt-6 text-[11px] text-slate-400">
        관리자 이메일만 접근 가능합니다. (환경 변수 ADMIN_EMAILS)
      </p>
    </div>
  );
}
