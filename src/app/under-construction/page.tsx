import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import Logo from "@/components/ui/Logo";

export const metadata = {
  title: "공사 중 · ZEFF AI",
  robots: { index: false, follow: false },
};

/**
 * 사이트 앞문 — 본 서비스 UI는 그대로 두고, 방문자는 여기서 막힌다.
 * 관리자는 /login 으로 들어가 세션을 만든 뒤 전체 사이트에 접근한다.
 */
export default async function UnderConstructionPage() {
  const session = await auth();
  if (isAdminSession(session)) {
    redirect("/");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#0a1f4e] px-6 text-center text-slate-200">
      <Logo size="lg" />
      <h1 className="mt-10 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        공사 중
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
        ZEFF AI 서비스를 준비하고 있습니다.
        <br />
        잠시 후 다시 방문해 주세요.
      </p>
      <Link
        href="/login?callbackUrl=%2F"
        className="mt-10 inline-flex min-h-[44px] items-center rounded-full border border-white/25 px-6 text-sm font-medium text-white transition-colors hover:bg-white/10"
      >
        관리자 로그인
      </Link>
      <p className="mt-3 text-xs text-slate-500">관리자 계정만 접속할 수 있습니다.</p>
    </main>
  );
}
