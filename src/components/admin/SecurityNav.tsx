import Link from "next/link";
import {
  Shield,
  Bug,
  Radio,
  TrendingUp,
  Users,
  HardDrive,
  ChevronDown,
} from "lucide-react";

const SECTIONS = [
  { href: "/admin/security", label: "대시보드", icon: Shield, exact: true },
  { href: "/admin/security/vuln", label: "AI 취약점", icon: Bug },
  { href: "/admin/security/monitor", label: "실시간 모니터링", icon: Radio },
  { href: "/admin/security/predict", label: "예측·분석", icon: TrendingUp },
  { href: "/admin/security/access", label: "접근 제어", icon: Users },
];

const OPS = [
  { href: "/admin/security/backup", label: "백업" },
  { href: "/admin/security/workspace", label: "워크스페이스" },
  { href: "/admin/security/homepage", label: "홈page rate limit" },
  { href: "/admin/security/system", label: "시스템" },
  { href: "/admin/security/ai-usage", label: "AI 사용량" },
  { href: "/admin/security/ai-learning", label: "학습 데이터" },
];

export default function SecurityNav({ pathname }: { pathname: string }) {
  const opsActive = OPS.some((o) => pathname === o.href || pathname.startsWith(`${o.href}/`));

  return (
    <nav className="mb-6 space-y-2">
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
        {SECTIONS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </Link>
          );
        })}
        <details className="relative inline-block" open={opsActive}>
          <summary
            className={`inline-flex cursor-pointer list-none items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
              opsActive
                ? "bg-slate-800 text-white dark:bg-slate-700"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <HardDrive className="h-3.5 w-3.5" />
            운영
            <ChevronDown className="h-3 w-3" />
          </summary>
          <div className="absolute left-0 z-20 mt-1 min-w-[10rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            {OPS.map((o) => (
              <Link
                key={o.href}
                href={o.href}
                className="block px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {o.label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </nav>
  );
}
