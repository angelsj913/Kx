"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Sparkles } from "lucide-react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11C3.25 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.61H1.27A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l4 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

function LoginCard() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/app";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 text-slate-100">
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[140px]" />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-700/60 bg-slate-900/70 p-8 text-center shadow-2xl shadow-black/40 backdrop-blur-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-50">AI 툴킷 로그인</h1>
        <p className="mt-2 text-sm text-slate-400">
          로그인하면 어느 기기에서든 대화와 결과물을 이어서 사용할 수 있어요.
        </p>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700/60 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <GoogleIcon />
          구글로 로그인
        </button>

        <button
          type="button"
          disabled
          title="애플 로그인은 준비 중입니다"
          className="mt-3 flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-slate-700/60 bg-slate-800/50 px-6 py-3 text-sm font-medium text-slate-500"
        >
          Apple로 로그인 (준비 중)
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginCard />
    </Suspense>
  );
}
