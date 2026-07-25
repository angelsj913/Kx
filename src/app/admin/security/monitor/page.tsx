import Link from "next/link";
import { requireSecurityPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";

export const dynamic = "force-dynamic";

export default async function MonitorHubPage() {
  await requireSecurityPage();

  const links = [
    { href: "/admin/security/monitor/events", label: "보안 이벤트 로그", desc: "감사·로그인 이벤트" },
    { href: "/admin/security/live", label: "실시간 피드", desc: "SSE live stream" },
    { href: "/admin/security/monitor/traffic", label: "트래픽·패턴", desc: "Rate limit · 로그인 burst" },
    { href: "/admin/security/monitor/alerts", label: "알림 설정", desc: "이메일 · 임계값" },
  ];

  return (
    <SecurityPageShell title="실시간 위험 모니터링" description="이벤트 · 트래픽 · 알림">
      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="font-medium">{l.label}</p>
            <p className="mt-1 text-xs text-slate-500">{l.desc}</p>
          </Link>
        ))}
      </div>
    </SecurityPageShell>
  );
}
