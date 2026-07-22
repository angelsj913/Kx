import Link from "next/link";
import { requireSecurityPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";

export const dynamic = "force-dynamic";

export default async function AccessHubPage() {
  await requireSecurityPage();

  const links = [
    { href: "/admin/security/access/users", label: "사용자 계정", desc: "회원 목록 · 요금제" },
    { href: "/admin/security/access/logs", label: "접근 로그", desc: "LoginEvent" },
    { href: "/admin/security/access/rbac", label: "역할·권한", desc: "RBAC" },
    { href: "/admin/security/threats", label: "비정상 접근", desc: "위험 이벤트" },
  ];

  return (
    <SecurityPageShell title="접근 제어 관리" description="계정 · RBAC · 로그">
      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="font-medium">{l.label}</p>
            <p className="mt-1 text-xs text-slate-500">{l.desc}</p>
          </Link>
        ))}
      </div>
    </SecurityPageShell>
  );
}
