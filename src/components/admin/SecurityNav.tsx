import Link from "next/link";
import {
  Shield,
  KeyRound,
  Activity,
  Brain,
  BookOpen,
  Radio,
  Home,
  Building2,
  Settings,
  HardDrive,
} from "lucide-react";

const ITEMS = [
  { href: "/admin/security", label: "요약", icon: Shield },
  { href: "/admin/security/auth", label: "로그인·가입", icon: KeyRound },
  { href: "/admin/security/activity", label: "활동 감사", icon: Activity },
  { href: "/admin/security/ai-usage", label: "AI 사용량", icon: Brain },
  { href: "/admin/security/ai-learning", label: "학습 데이터", icon: BookOpen },
  { href: "/admin/security/live", label: "실시간", icon: Radio },
  { href: "/admin/security/homepage", label: "홈페이지", icon: Home },
  { href: "/admin/security/workspace", label: "워크스페이스", icon: Building2 },
  { href: "/admin/security/system", label: "시스템", icon: Settings },
  { href: "/admin/security/backup", label: "백업", icon: HardDrive },
];

export default function SecurityNav({ pathname }: { pathname: string }) {
  return (
    <nav className="mb-6 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/admin/security"
            ? pathname === "/admin/security"
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
    </nav>
  );
}
