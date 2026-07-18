import Logo from "@/components/ui/Logo";

/**
 * 홈 → /app 진입 시 서버 인증·데이터 준비 동안 화면이 얼어붙은 것처럼 보이는 대신
 * 즉시 브랜드 로딩 화면을 보여준다 (App Router loading boundary).
 */
export default function AppLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
      <Logo size="lg" withWordmark spin />
      <p className="text-sm text-slate-500 dark:text-slate-400">
        워크스페이스를 여는 중…
      </p>
    </div>
  );
}
