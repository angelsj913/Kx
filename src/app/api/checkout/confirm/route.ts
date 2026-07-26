import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { getPlan, PLANS } from "@/lib/plans";
import { fulfillPaidOrder, orderBelongsToUser, isStubCheckoutAllowed } from "@/lib/billing";
import { assertRateLimit, clientIp, RateLimitError } from "@/lib/rateLimit";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 결제 완료 확인 + 요금제 권한 부여.
 * 결제대행사 미연동 상태 — 개발/프리뷰에서만 스텁으로 pending → paid 처리한다.
 * 연동이 붙으면 여기서 대행사에 결제 상태를 조회해 검증한 뒤 부여해야 한다.
 */
export async function POST(request: Request) {
  try {
    // 요금제 권한이 실제로 부여되는 지점이라 결제창보다 값이 높은 표적이다.
    // 남의 주문번호를 긁어 맞히려는 시도를 여기서 끊는다(소유자 검사는 아래에서 별도).
    await assertRateLimit("checkout:confirm:ip", clientIp(request), { max: 40, windowSeconds: 600 });

    const userId = await requireUserId();
    if (userId instanceof NextResponse) return userId;

    // 완료 페이지가 새로고침될 수 있어 여유를 두되, 반복 조회는 막는다.
    await assertRateLimit("checkout:confirm:user", userId, { max: 15, windowSeconds: 600 });

    const body = await request.json().catch(() => ({}));
    const merchantUid =
      typeof body?.merchantUid === "string" ? body.merchantUid.trim() : "";
    if (!merchantUid) {
      return NextResponse.json({ error: "주문번호(merchantUid)가 필요합니다." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { merchantUid } });
    if (!order) {
      return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
    }
    if (!orderBelongsToUser(order, userId)) {
      return NextResponse.json({ error: "본인 주문만 확인할 수 있습니다." }, { status: 403 });
    }

    // 이미 결제 완료된 주문 — plan 만 재적용(멱등)
    if (order.status === "paid") {
      const result = await fulfillPaidOrder({
        merchantUid,
        userId,
        source: "checkout_confirm",
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json(successPayload(result));
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: `이 주문은 ${order.status} 상태라 완료 처리할 수 없습니다.` },
        { status: 400 }
      );
    }

    // 스텁 모드 (결제대행사 미연동): 테스트 결제 완료로 처리.
    // 프로덕션에서는 실제 결제 검증 없이 요금제가 부여되지 않도록 차단한다.
    if (!isStubCheckoutAllowed()) {
      console.error("checkout confirm error: 결제대행사 미연동");
      return NextResponse.json(
        { error: "결제 시스템 점검 중입니다. 잠시 후 다시 시도해 주세요." },
        { status: 503 }
      );
    }
    const result = await fulfillPaidOrder({ merchantUid, userId, source: "stub" });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ...successPayload(result), stub: true });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error("checkout confirm error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}

function successPayload(result: Awaited<ReturnType<typeof fulfillPaidOrder>>) {
  const planId = result.plan!;
  const def = getPlan(planId) ?? PLANS[planId];
  return {
    ok: true,
    alreadyPaid: !!result.alreadyPaid,
    order: result.order,
    plan: planId,
    planName: def?.name ?? planId,
    planLabel: def?.label ?? planId,
    // amount 와 currency 는 항상 같은 출처에서 — 섞이면 금액이 다른 통화로 찍힌다
    amount: result.order?.amount ?? def?.amount ?? 0,
    currency: result.order?.currency ?? def?.currency ?? "usd",
    benefits: def?.bullets ?? [],
    message: "결제가 완료되었습니다",
  };
}
