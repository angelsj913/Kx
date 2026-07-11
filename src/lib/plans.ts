// 유료 플랜 정의. Stripe Checkout에 인라인 price_data로 전달하므로 대시보드 price ID가 필요 없다.
export interface PlanDef {
  id: string;
  label: string;
  amount: number; // 최소 화폐 단위 (센트)
  currency: string;
}

export const PLANS: Record<string, PlanDef> = {
  pro: { id: "pro", label: "Pro", amount: 1299, currency: "usd" },
  professional: { id: "professional", label: "Professional", amount: 1999, currency: "usd" },
};

export function getPlan(id: string | null | undefined): PlanDef | undefined {
  if (!id) return undefined;
  return PLANS[id];
}

/** 고유 주문번호(Merchant UID) 발행 */
export function newMerchantUid(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ZEFF-${Date.now()}-${rand}`;
}
