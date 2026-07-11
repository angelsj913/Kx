"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import ThemeToggle from "@/components/ThemeToggle";
import { PLANS } from "@/lib/plans";

function CheckoutInner() {
  const params = useSearchParams();
  const planId = params.get("plan") ?? "";
  const canceled = params.get("canceled") === "1";
  const plan = PLANS[planId];

  const [state, setState] = useState<"init" | "loading" | "stub" | "error">(
    !plan ? "error" : canceled ? "init" : "loading"
  );
  const [error, setError] = useState(!plan ? "알 수 없는 요금제입니다." : "");

  useEffect(() => {
    if (!plan || canceled) return;
    let ignore = false;
    (async () => {
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: planId }),
        });
        const data = await res.json();
        if (ignore) return;
        if (!res.ok) throw new Error(data?.error ?? "결제 준비에 실패했습니다.");
        if (data.url) {
          window.location.href = data.url; // Stripe 결제창으로 이동
        } else {
          setState("stub"); // 결제 연동 전(스텁)
        }
      } catch (err) {
        if (ignore) return;
        setState("error");
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      }
    })();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const amount = plan ? `₩${plan.amount.toLocaleString("ko-KR")}` : "";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] dark:bg-slate-950 dark:text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200/80 px-6 py-3.5 dark:border-slate-800/80">
        <BackButton fallbackHref="/" />
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-zeff.png" alt="ZEFF AI" width={24} height={24} className="rounded-md dark:invert" />
          <span className="text-sm font-bold tracking-tight">ZEFF AI</span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10">
            <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="mt-4 text-lg font-bold">
            ZEFF AI {plan?.label ?? ""} {plan ? "구독" : ""}
          </h1>
          {plan && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{amount} / 월</p>}

          <div className="mt-6">
            {state === "loading" && (
              <div className="flex flex-col items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
                결제창을 준비하는 중...
              </div>
            )}

            {state === "stub" && (
              <div className="space-y-3">
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                  결제 시스템 연동 준비가 완료되었습니다. 결제 키(STRIPE_SECRET_KEY)가 등록되면 이 화면에서 바로 결제창이 열립니다.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">주문은 정상적으로 발행되었습니다.</p>
              </div>
            )}

            {(state === "error" || canceled) && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                  {canceled ? "결제가 취소되었습니다." : error}
                </div>
                {plan && (
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                  >
                    다시 시도
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutInner />
    </Suspense>
  );
}
