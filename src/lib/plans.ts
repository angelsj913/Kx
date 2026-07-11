// 유료 플랜 정의. Stripe Checkout에 인라인 price_data로 전달하므로 대시보드 price ID가 필요 없다.
export interface PlanDef {
  id: string;
  label: string;
  amount: number; // 최소 화폐 단위. KRW는 zero-decimal 통화이므로 원(₩) 단위 그대로.
  currency: string;
}

// 화면 표시가(₩12,900 / ₩23,900)와 실제 청구액을 일치시킨다.
export const PLANS: Record<string, PlanDef> = {
  pro: { id: "pro", label: "Pro", amount: 12900, currency: "krw" },
  professional: { id: "professional", label: "Professional", amount: 23900, currency: "krw" },
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
