import Logo from "@/components/ui/Logo";

/**
 * 홈 → /app 진입 시 서버 인증·데이터 준비 동안 화면이 얼어붙은 것처럼 보이는 대신
 * 즉시 브랜드 로딩 화면을 보여준다 (App Router loading boundary).
 */
export default function AppLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Logo size="lg" withWordmark={false} spin />
    </div>
  );
}
