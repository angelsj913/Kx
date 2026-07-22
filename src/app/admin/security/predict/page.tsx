import Link from "next/link";
import { requireSecurityPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";
import { PredictPanel } from "@/components/admin/PredictPanel";

export const dynamic = "force-dynamic";

export default async function PredictHubPage() {
  await requireSecurityPage();

  return (
    <SecurityPageShell title="예측 위험 분석" description="휴리스틱 리스크 · 강화 권고">
      <PredictPanel />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/security/predict/hardening"
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="font-medium">보안 강화 권고</p>
          <p className="mt-1 text-xs text-slate-500">정책 템플릿 · 조치 목록</p>
        </Link>
        <Link
          href="/admin/ai"
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="font-medium">AI 모델 관리</p>
          <p className="mt-1 text-xs text-slate-500">kill switch · 일일 상한</p>
        </Link>
      </div>
    </SecurityPageShell>
  );
}
