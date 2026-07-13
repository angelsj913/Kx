import Link from "next/link";
import { ShieldAlert } from "lucide-react";

type Props = {
  email?: string | null;
  reason: "unauthenticated" | "forbidden";
};

export default function AdminAccessDenied({ email, reason }: Props) {
  const title =
    reason === "unauthenticated"
      ? "로그인이 필요합니다"
      : "관리자 권한이 없습니다";

  const detail =
    reason === "unauthenticated"
      ? "관리자 패널은 로그인 후 이용할 수 있습니다. zeff@zeffai.com 으로 로그인해 주세요."
      : email
        ? `현재 로그인: ${email}. 이 계정은 관리자 목록에 없습니다.`
        : "세션에 이메일이 없어 관리자 여부를 확인할 수 없습니다. 로그아웃 후 Google로 다시 로그인해 주세요.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{detail}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {reason === "unauthenticated" ? (
            <Link
              href="/login?callbackUrl=/admin"
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              로그인하기
            </Link>
          ) : (
            <Link
              href="/login?callbackUrl=/admin"
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              다른 계정으로 로그인
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
