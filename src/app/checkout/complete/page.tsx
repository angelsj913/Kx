"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { PLANS, isPlanId, type PlanId } from "@/lib/plans";

type ConfirmOk = {
  ok: true;
  alreadyPaid?: boolean;
  stub?: boolean;
  plan: string;
  planName: string;
  planLabel: string;
  amount: number;
  currency: string;
  benefits: string[];
  message: string;
  order?: { merchantUid: string; status: string };
};

type ConfirmErr = { error: string };

function CompleteInner() {
  const params = useSearchParams();
  const uid = (params.get("uid") ?? params.get("merchantUid") ?? "").trim();
  const isStub = params.get("stub") === "1";

  const [phase, setPhase] = useState<"loading" | "success" | "error">(
    uid ? "loading" : "error"
  );
  const [error, setError] = useState(
    uid ? "" : "주문 정보가 없습니다. 요금제 페이지에서 다시 결제를 시작해 주세요."
  );
  const [data, setData] = useState<ConfirmOk | null>(null);

  useEffect(() => {
    if (!uid) return;
    let ignore = false;

    (async () => {
      try {
        const res = await fetch("/api/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ merchantUid: uid }),
        });
        const json = (await res.json()) as ConfirmOk | ConfirmErr;

        if (ignore) return;

        if (!res.ok || !("ok" in json) || !json.ok) {
          const msg =
            "error" in json && json.error
              ? json.error
              : res.status === 401
                ? "로그인이 필요합니다. 로그인 후 이 페이지를 다시 열어 주세요."
                : "결제 확인에 실패했습니다.";
          setPhase("error");
          setError(msg);
          return;
        }

        setData(json);
        setPhase("success");
      } catch {
        if (ignore) return;
        setPhase("error");
        setError("네트워크 오류로 결제 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    })();

    return () => {
      ignore = true;
    };
  }, [uid]);

  const planId = data && isPlanId(data.plan) ? (data.plan as PlanId) : null;
  const planDef = planId ? PLANS[planId] : null;
  const amountLabel =
    data != null
      ? `₩${(data.amount ?? 0).toLocaleString("ko-KR")}`
      : planDef
        ? planDef.priceLabel
        : "";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200/80 px-6 py-3.5 dark:border-slate-800/80">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-zeff.png"
            alt="ZEFF AI"
            width={24}
            height={24}
            className="rounded-md dark:invert"
          />
          <span className="text-sm font-bold tracking-tight">ZEFF AI</span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
          {phase === "loading" && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
              <h1 className="mt-4 text-xl font-bold">결제 확인 중…</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {isStub
                  ? "테스트 결제를 확정하고 요금제 권한을 부여하고 있습니다."
                  : "결제가 완료되었는지 확인하고 요금제를 적용하고 있습니다."}
              </p>
            </>
          )}

          {phase === "success" && data && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="mt-4 text-xl font-bold">결제가 완료되었습니다</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {data.planName}
                </span>{" "}
                요금제 권한이 계정에 적용되었습니다.
                {data.alreadyPaid ? " (이미 적용된 결제입니다)" : ""}
              </p>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left dark:border-slate-700 dark:bg-slate-800/60">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">요금제</span>
                  <span className="font-semibold">{data.planLabel}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">결제 금액</span>
                  <span className="font-semibold">{amountLabel} / 월</span>
                </div>
                {data.order?.merchantUid && (
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                    <span className="shrink-0 text-slate-500">주문번호</span>
                    <span className="truncate font-mono text-slate-600 dark:text-slate-300">
                      {data.order.merchantUid}
                    </span>
                  </div>
                )}
                {data.stub && (
                  <p className="mt-3 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                    결제 플랫폼 연동 전 · 테스트 결제 완료로 처리되었습니다.
                    Stripe 키가 등록되면 실제 결제로 전환됩니다.
                  </p>
                )}
              </div>

              {data.benefits?.length > 0 && (
                <ul className="mt-5 space-y-1.5 text-left">
                  {data.benefits.slice(0, 5).map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"
                    >
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 flex flex-col gap-2">
                <Link
                  href="/app"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-500"
                >
                  워크스페이스로 이동
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/"
                  className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  홈으로
                </Link>
              </div>
            </>
          )}

          {phase === "error" && (
            <>
              <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
              <h1 className="mt-4 text-xl font-bold">결제 확인 실패</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{error}</p>
              <div className="mt-6 flex flex-col gap-2">
                {uid && (
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
                  >
                    다시 확인
                  </button>
                )}
                <Link
                  href="/login?callbackUrl=/checkout/complete"
                  className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  로그인하기
                </Link>
                <Link
                  href="/"
                  className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  홈으로
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <CompleteInner />
    </Suspense>
  );
}
