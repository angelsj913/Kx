import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlan, PLANS } from "@/lib/plans";
import { getStripe, isStubCheckoutAllowed } from "@/lib/stripe";
import { fulfillPaidOrder, orderBelongsToUser } from "@/lib/billing";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 결제 완료 확인 + 요금제 권한 부여.
 * - Stripe 연동 전(스텁): 주문 pending → paid 처리 후 plan 부여
 * - Stripe 연동 후: Checkout Session 이 paid 인지 검증 후 부여 (웹훅 누락 대비)
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    const userId = session.user.id;

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

    const stripe = getStripe();

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

    // Stripe 연동 시: 세션 결제 상태 검증
    if (stripe && order.stripeSession) {
      try {
        const cs = await stripe.checkout.sessions.retrieve(order.stripeSession);
        const paid =
          cs.payment_status === "paid" ||
          cs.status === "complete";
        if (!paid) {
          return NextResponse.json(
            {
              error: "아직 결제가 완료되지 않았습니다.",
              paymentStatus: cs.payment_status,
              sessionStatus: cs.status,
            },
            { status: 402 }
          );
        }
        const result = await fulfillPaidOrder({
          merchantUid,
          userId: userId || cs.metadata?.userId || null,
          stripeSession: cs.id,
          source: "checkout_confirm",
        });
        if (!result.ok) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(successPayload(result));
      } catch (err) {
        console.error("stripe session retrieve error:", err);
        return NextResponse.json(
          { error: "결제 세션을 확인할 수 없습니다." },
          { status: 502 }
        );
      }
    }

    // 스텁 모드 (결제 플랫폼 미연동): 테스트 결제 완료로 처리
    // (개발/프리뷰 전용. 프로덕션에서는 실제 결제 검증 없이 요금제가 부여되지 않도록 차단)
    if (!stripe) {
      if (!isStubCheckoutAllowed()) {
        console.error("checkout confirm error: STRIPE_SECRET_KEY missing in production");
        return NextResponse.json(
          { error: "결제 시스템 점검 중입니다. 잠시 후 다시 시도해 주세요." },
          { status: 503 }
        );
      }
      const result = await fulfillPaidOrder({
        merchantUid,
        userId,
        source: "stub",
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ ...successPayload(result), stub: true });
    }

    // Stripe 는 있지만 세션 id 가 없는 비정상 주문
    return NextResponse.json(
      { error: "결제 세션이 없습니다. 체크아웃을 다시 시작해 주세요." },
      { status: 400 }
    );
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
