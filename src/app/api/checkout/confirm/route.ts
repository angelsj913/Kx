import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { getPlan, PLANS } from "@/lib/plans";
import { fulfillPaidOrder, orderBelongsToUser, isStubCheckoutAllowed } from "@/lib/billing";
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
    const userId = await requireUserId();
    if (userId instanceof NextResponse) return userId;

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
    amount: result.order?.amount ?? def?.amount ?? 0,
    currency: result.order?.currency ?? "krw",
    benefits: def?.bullets ?? [],
    message: "결제가 완료되었습니다",
  };
}
