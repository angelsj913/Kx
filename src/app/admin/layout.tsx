import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, MessageSquare, CreditCard, Users, ArrowLeft } from "lucide-react";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "개발자 관리 · ZEFF AI" };

const NAV = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/inquiries", label: "1:1 문의", icon: MessageSquare },
  { href: "/admin/orders", label: "주문·결제", icon: CreditCard },
  { href: "/admin/users", label: "회원", icon: Users },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-bold text-white">DEV</span>
            <span className="text-sm font-bold tracking-tight">ZEFF AI 관리 콘솔</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline">{session.user.email}</span>
            <Link href="/" className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400">
              <ArrowLeft className="h-3.5 w-3.5" />
              사이트로
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row">
        <nav className="flex shrink-0 flex-row flex-wrap gap-1 md:w-52 md:flex-col">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-blue-300"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
