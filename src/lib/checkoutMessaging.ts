import { PLANS, isPlanId, type PlanId } from "@/lib/plans";

export function existingSubscriptionMessage(currentPlan: string, requestedPlan: string): string | null {
  if (!isPlanId(currentPlan) || currentPlan === "free") return null;
  if (!isPlanId(requestedPlan) || requestedPlan === "free") return null;

  const currentLabel = PLANS[currentPlan as PlanId].label;
  const requestedLabel = PLANS[requestedPlan as PlanId].label;

  if (currentPlan === requestedPlan) {
    return `이미 ${currentLabel} 구독 중입니다. 요금제 변경과 해지는 고객센터로 문의해 주세요.`;
  }

  return `현재 ${currentLabel} 구독 중입니다. ${requestedLabel} 결제는 요금제 변경과 해지 후 진행해 주세요.`;
}
