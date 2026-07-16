import Stripe from "stripe";

let cached: Stripe | null = null;

/** STRIPE_SECRET_KEY가 있으면 Stripe 클라이언트를 반환, 없으면 null(스텁 모드). */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) cached = new Stripe(key);
  return cached;
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
