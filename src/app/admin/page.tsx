import Link from "next/link";
import { MessageSquare, CreditCard, Users, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getStats() {
  const [users, orders, paidOrders, inquiries, openInquiries] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "paid" } }),
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { status: { not: "답변완료" } } }),
  ]);
  return { users, orders, paidOrders, inquiries, openInquiries };
}

export default async function AdminDashboard() {
  const s = await getStats();

  const cards = [
    { label: "회원", value: s.users, icon: Users, href: "/admin/users", accent: "text-blue-600 dark:text-blue-400" },
    { label: "미답변 문의", value: s.openInquiries, icon: Clock, href: "/admin/inquiries", accent: "text-rose-600 dark:text-rose-400" },
    { label: "전체 문의", value: s.inquiries, icon: MessageSquare, href: "/admin/inquiries", accent: "text-slate-600 dark:text-slate-300" },
    { label: "결제 완료 주문", value: `${s.paidOrders} / ${s.orders}`, icon: CreditCard, href: "/admin/orders", accent: "text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold">대시보드</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">사이트 운영 현황을 한눈에 확인합니다.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, href, accent }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-400/60 dark:border-slate-800 dark:bg-slate-900"
          >
            <Icon className={`h-5 w-5 ${accent}`} />
            <p className="mt-3 text-2xl font-bold">{value}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
