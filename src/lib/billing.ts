/**
 * 결제 확인 → 주문 paid + UserSettings.plan 부여 (단일 진입점)
 * 완료 페이지 confirm API · 스텁 결제에서 공용. 결제대행사 연동이 붙으면
 * 그 콜백도 이 함수를 지나게 한다 — 권한 부여 지점은 하나로 유지한다.
 */
import { prisma } from "@/lib/prisma";
import { getPlan, isPlanId, type PlanId } from "@/lib/plans";

export type FulfillSource = "checkout_confirm" | "stub";

/**
 * 스텁 결제(테스트 완료 처리)는 개발/프리뷰 환경에서만 허용한다.
 * 프로덕션에서 결제대행사가 연동되지 않았으면 실제 결제를 요구하도록 막아,
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

export type FulfillResult = {
  ok: boolean;
  alreadyPaid?: boolean;
  order?: {
    id: string;
    merchantUid: string;
    plan: string;
    amount: number;
    currency: string;
    status: string;
  };
  plan?: PlanId;
  error?: string;
};

/**
 * 결제 완료 처리: 주문 status=paid + 사용자 plan 권한 부여.
 * 멱등 — 이미 paid 여도 plan 이 다르면 다시 맞춘다.
 */
export async function fulfillPaidOrder(opts: {
  merchantUid: string;
  /** 결제 콜백에서 보강할 userId (주문에 없을 때) */
  userId?: string | null;
  source: FulfillSource;
}): Promise<FulfillResult> {
  const merchantUid = opts.merchantUid?.trim();
  if (!merchantUid) {
    return { ok: false, error: "주문번호가 없습니다." };
  }

  const order = await prisma.order.findUnique({ where: { merchantUid } });
  if (!order) {
    return { ok: false, error: "주문을 찾을 수 없습니다." };
  }

  if (order.status === "canceled" || order.status === "failed") {
    return { ok: false, error: `이 주문은 ${order.status} 상태입니다.` };
  }

  const planId = isPlanId(order.plan) && order.plan !== "free" ? order.plan : null;
  if (!planId || !getPlan(planId)) {
    return { ok: false, error: "유효하지 않은 요금제 주문입니다." };
  }

  const userId = opts.userId || order.userId;
  if (!userId) {
    return {
      ok: false,
      error: "결제 계정과 연결된 사용자가 없습니다. 로그인 후 다시 결제를 진행해 주세요.",
    };
  }

  const alreadyPaid = order.status === "paid";

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: "paid", userId },
  });

  // 요금제 권한 자동 부여
  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, plan: planId },
    update: { plan: planId },
  });

  return {
    ok: true,
    alreadyPaid,
    plan: planId,
    order: {
      id: updated.id,
      merchantUid: updated.merchantUid,
      plan: updated.plan,
      amount: updated.amount,
      currency: updated.currency,
      status: updated.status,
    },
  };
}

/** 주문 소유자 확인 (본인 주문만 완료 처리) */
export function orderBelongsToUser(
  order: { userId: string | null },
  userId: string
): boolean {
  // 주문 생성 시 미로그인이었으면 완료 시점에 연결 허용
  if (!order.userId) return true;
  return order.userId === userId;
}
