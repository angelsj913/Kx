import Link from "next/link";
import { requireSecurityPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";

export const dynamic = "force-dynamic";

const POLICIES = [
  "관리자 /admin 진입 시 이메일 OTP(8h) 유지",
  "비관리자 /admin 접근 시 공홈(/) redirect",
  "48h 암호화 백업(Electron HDD) 스케줄 확인",
  "Rate limit 초과 scope 주간 검토",
  "npm audit OSS 스캔 월 1회",
];

export default async function HardeningPage() {
  await requireSecurityPage();

  return (
    <SecurityPageShell title="보안 강화 권고" description="정책 수립 · 체크리스트">
      <ul className="space-y-3">
        {POLICIES.map((p) => (
          <li
            key={p}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900"
          >
            {p}
          </li>
        ))}
      </ul>
      <Link href="/admin/security/system" className="mt-4 inline-block text-xs text-blue-600 hover:underline">
        SystemConfig에서 정책 키 관리 →
      </Link>
    </SecurityPageShell>
  );
}
