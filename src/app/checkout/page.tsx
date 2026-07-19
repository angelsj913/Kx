"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CreditCard, AlertCircle, Check } from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import ThemeToggle from "@/components/ThemeToggle";
import { PLANS, isPlanId, type PlanId } from "@/lib/plans";
import { getCheckoutT, readCheckoutLanguage } from "@/lib/checkoutI18n";
import { setAppLanguage, type AppLanguage } from "@/lib/i18n";
import { LANGUAGE_ORDER } from "@/lib/languages";

function CheckoutInner() {
  const params = useSearchParams();
  const router = useRouter();
  const planId = params.get("plan") ?? "";
  const interval = params.get("interval") === "year" ? "year" : "month";
  const canceled = params.get("canceled") === "1";
  const plan = isPlanId(planId) && planId !== "free" ? PLANS[planId as PlanId] : undefined;
  const isAnnual = interval === "year" && plan?.annualAmount != null;

  // 설정 언어 우선 동기화 (UserSettings → localStorage 폴백)
  const [lang, setLang] = useState<AppLanguage>(() => readCheckoutLanguage());
  const ct = useMemo(() => getCheckoutT(lang), [lang]);

  const [state, setState] = useState<"init" | "loading" | "stub" | "error">(
    !plan ? "error" : canceled ? "init" : "loading",
  );
  const [error, setError] = useState(!plan ? getCheckoutT(readCheckoutLanguage()).unknownPlan : "");
  const [merchantUid, setMerchantUid] = useState("");
  const [paying, setPaying] = useState(false);

  // 워크스페이스 설정 언어 → 결제창 동기화
  useEffect(() => {
    let ignore = false;
    void (async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const data = await res.json();
        const raw = data?.settings?.language;
        if (
          typeof raw === "string" &&
          (LANGUAGE_ORDER as string[]).includes(raw) &&
          !ignore
        ) {
          const next = raw as AppLanguage;
          setLang(next);
          setAppLanguage(next);
        }
      } catch {
        /* keep localStorage language */
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!plan || canceled) return;
    let ignore = false;
    (async () => {
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: planId, interval }),
        });
        const data = await res.json();
        if (ignore) return;
        if (res.status === 401 || data?.needLogin) {
          router.replace(
            `/login?callbackUrl=${encodeURIComponent(`/checkout?plan=${planId}&interval=${interval}`)}`,
          );
          return;
        }
        if (!res.ok) throw new Error(data?.error ?? ct.prepareFail);
        if (data.url) {
          // Stripe locale 힌트 (지원 시)
          const url = String(data.url);
          window.location.href = url;
          return;
        }
        setMerchantUid(data.merchantUid ?? "");
        setState("stub");
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

  const amount = plan
    ? `₩${(isAnnual ? (plan.annualAmount as number) : plan.amount).toLocaleString("ko-KR")}`
    : "";

  function goComplete() {
    if (!merchantUid || paying) return;
    setPaying(true);
    window.location.href = `/checkout/complete?uid=${encodeURIComponent(merchantUid)}&stub=1`;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] dark:bg-slate-950 dark:text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200/80 px-6 py-3.5 dark:border-slate-800/80">
        <BackButton fallbackHref="/" />
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-zeff.png"
            alt="ZEFF AI"
            width={24}
            height={24}
            className="rounded-md dark:hidden"
          />
          <Image
            src="/logo-zeff-dark.png"
            alt="ZEFF AI"
            width={24}
            height={24}
            className="hidden rounded-md dark:block"
          />
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
            ZEFF AI {plan?.label ?? ""} {plan ? ct.subscribe : ""}
          </h1>
          {plan && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {amount} {ct.perMonth}
            </p>
          )}

          <div className="mt-6">
            {state === "loading" && (
              <div className="flex flex-col items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
                {ct.preparing}
              </div>
            )}

            {state === "stub" && plan && (
              <div className="space-y-4 text-left">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {ct.orderSummary}
                  </p>
                  <div className="mt-2 flex justify-between text-sm">
                    <span>{plan.name}</span>
                    <span className="font-semibold">{amount}</span>
                  </div>
                  <ul className="mt-3 space-y-1">
                    {plan.bullets.slice(0, 4).map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300"
                      >
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  {ct.stubNote}
                </p>

                {merchantUid && (
                  <p className="truncate text-center font-mono text-[10px] text-slate-400">
                    {merchantUid}
                  </p>
                )}

                <button
                  type="button"
                  disabled={!merchantUid || paying}
                  onClick={goComplete}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:from-blue-500 hover:to-indigo-400 disabled:opacity-60"
                >
                  {paying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {ct.moving}
                    </>
                  ) : (
                    ct.completeSim
                  )}
                </button>
              </div>
            )}

            {(state === "error" || canceled) && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                  {canceled ? ct.canceled : error}
                </div>
                {plan && (
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                  >
                    {ct.retry}
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
