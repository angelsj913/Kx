import Stripe from "stripe";
import type { PlanId } from "@/lib/plans";

let cached: Stripe | null = null;

/** STRIPE_SECRET_KEY가 있으면 Stripe 클라이언트를 반환, 없으면 null(스텁 모드). */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // apiVersion 고정 — SDK 타입이 이 리터럴 하나만 받으므로, stripe 패키지를 올리면
  // tsc 가 여기서 깨진다. 무언의 동작 변경 대신 명시적 검토를 강제하는 게 목적이다.
  if (!cached) cached = new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
  return cached;
}

export type BillingInterval = "month" | "year";

/**
 * 유료 플랜 × 결제주기 → Stripe Price ID.
 * price_data 인라인 대신 대시보드의 Price 객체를 쓰는 이유: 고객 포털의 플랜 변경은
 * "바꿀 수 있는 다른 가격"을 Stripe 가 알고 있어야만 열린다.
 * 서버 전용 — plans.ts 는 클라이언트 컴포넌트가 import 하므로 여기 둔다.
 */
export function priceIdFor(plan: PlanId, interval: BillingInterval): string | undefined {
  if (plan === "free") return undefined;
  const key = `STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}`;
  return process.env[key]?.trim() || undefined;
}

/** 유료 플랜 × 주기 전 조합 — 자가점검·역방향 조회에서 공용. */
export const PAID_PRICE_COMBOS: ReadonlyArray<[Exclude<PlanId, "free">, BillingInterval]> = [
  ["pro", "month"],
  ["pro", "year"],
  ["professional", "month"],
  ["professional", "year"],
];

/** 포털에서 플랜을 바꾸면 웹훅에 Price ID만 실려 오므로 역방향 조회가 필요하다. */
export function planForPriceId(priceId: string): PlanId | undefined {
  return PAID_PRICE_COMBOS.find(([plan, interval]) => priceIdFor(plan, interval) === priceId)?.[0];
}

/**
 * 스텁 결제(테스트 완료 처리)는 개발/프리뷰 환경에서만 허용한다.
 * 프로덕션에서 STRIPE_SECRET_KEY 가 비어 있으면 실제 결제를 요구하도록 막아,
 * 무료로 요금제가 부여되는 우회를 방지한다.
 */
export function isStubCheckoutAllowed(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}
