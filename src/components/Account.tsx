"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { LogOut, UserRound } from "lucide-react";

export default function Account() {
  const { data: session, status } = useSession();

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
            <UserRound className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-50">내 계정</h1>
            <p className="text-sm text-slate-400">
              로그인 상태와 계정 정보를 확인할 수 있어요.
            </p>
          </div>
        </div>

        {status === "authenticated" && session?.user ? (
          <div className="mt-8">
            <div className="flex items-center gap-4 rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-full border border-slate-700/60"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500">
                  <UserRound className="h-6 w-6 text-white" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-100">
                  {session.user.name ?? "사용자"}
                </p>
                <p className="truncate text-xs text-slate-500">{session.user.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/60 px-6 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-red-500/40 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>

            <p className="mt-4 text-center text-xs text-slate-600">
              이 계정으로 로그인하면 어느 기기에서든 대화 기록과 만든 파일을
              이어서 확인할 수 있어요.
            </p>
          </div>
        ) : (
          <div className="mt-8">
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/app" })}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              구글로 로그인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
