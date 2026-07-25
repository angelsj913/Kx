import SecurityDashboardClient from "@/components/admin/SecurityDashboardClient";

// 스킬 기반 방어 자가점검 콘솔. /admin/security 인덱스(#42 위협 콘솔)와 별개 하위 라우트로 공존한다.
// 상위 /admin/security/layout.tsx의 requireSecurityPage() 가드가 이 페이지도 보호한다.
export const dynamic = "force-dynamic";

export default function SecuritySelfScanPage() {
  return <SecurityDashboardClient />;
}
