import Stripe from "stripe";

let cached: Stripe | null = null;

/** STRIPE_SECRET_KEY가 있으면 Stripe 클라이언트를 반환, 없으면 null(스텁 모드). */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) cached = new Stripe(key);
  return cached;
}

export function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}
