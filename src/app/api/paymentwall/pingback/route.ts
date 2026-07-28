import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLANS, newMerchantUid } from "@/lib/plans";
import { fulfillPaidOrder } from "@/lib/billing";
import {
  verifyPingbackSignature,
  planForProductId,
  PINGBACK_TYPE,
} from "@/lib/paymentwall";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Paymentwall pingback — 결제·해지·차지백이 앱에 반영되는 유일한 경로다.
 *
 * 규약:
 * - 성공 처리 시 본문에 정확히 "OK" 를 200 으로 돌려줘야 한다. 그 외에는 30분마다 재시도한다.
 * - 재시도가 있으므로 모든 처리는 멱등이어야 한다. fulfillPaidOrder 가 이미 멱등이다.
 * - 서명 검증만으로 충분하다(공식 문서). IP 화이트리스트는 대역이 바뀌어 유지비만 든다.
 *
 * 인증 없는 공개 엔드포인트지만 서명으로 보호된다.
 */
async function handle(params: Record<string, string>): Promise<NextResponse> {
  if (!verifyPingbackSignature(params)) {
    console.error("paymentwall pingback: 서명 검증 실패", { ref: params.ref, type: params.type });
    // 재시도를 유도하지 않는다 — 서명이 틀린 요청은 다시 보내도 계속 틀리다.
    return new NextResponse("INVALID SIGNATURE", { status: 403 });
  }

  // 샌드박스 결제로 프로덕션 요금제가 부여되는 것을 막는다.
  if (params.is_test && process.env.NODE_ENV === "production") {
    console.warn("paymentwall pingback: 프로덕션에서 테스트 결제 수신 — 무시", { ref: params.ref });
    return new NextResponse("OK", { status: 200 });
  }

  const userId = params.uid?.trim();
  const type = params.type ?? "";
  if (!userId) {
    console.error("paymentwall pingback: uid 없음", { ref: params.ref });
    return new NextResponse("OK", { status: 200 });
  }

  if (type === PINGBACK_TYPE.PAYMENT) {
    const plan = params.goodsid ? planForProductId(params.goodsid) : undefined;
    if (!plan) {
      console.error("paymentwall pingback: 알 수 없는 goodsid", { goodsid: params.goodsid });
      return new NextResponse("OK", { status: 200 });
    }

    const def = PLANS[plan];
    const amount = def.amount;

    // 결제창을 연 시점의 주문을 찾아 잇는다. 없으면 만든다 — 돈은 이미 받았으므로
    // 주문 기록이 없다는 이유로 권한 부여를 거르면 안 된다.
    const pending = await prisma.order.findFirst({
      where: { userId, plan, status: "pending" },
      orderBy: { createdAt: "desc" },
    });

    const merchantUid = pending?.merchantUid ?? newMerchantUid();
    if (!pending) {
      await prisma.order.create({
        data: {
          merchantUid,
          userId,
          plan,
          amount,
          currency: def.currency,
          status: "pending",
          providerRef: params.ref ?? null,
        },
      });
    } else if (params.ref && pending.providerRef !== params.ref) {
      await prisma.order.update({
        where: { id: pending.id },
        data: { providerRef: params.ref },
      });
    }

    const result = await fulfillPaidOrder({
      merchantUid,
      userId,
      source: "paymentwall_pingback",
    });
    if (!result.ok) {
      console.error("paymentwall pingback: 권한 부여 실패", { merchantUid, error: result.error });
      // 500 을 돌려 재시도를 받는다 — 일시적 DB 오류면 다음 시도에 성공한다.
      return new NextResponse("ERROR", { status: 500 });
    }
    return new NextResponse("OK", { status: 200 });
  }

  // 구독이 끝났거나 결제가 회수된 경우 — 무료로 내린다.
  // 12(해지)는 즉시 해지 통지다. 기간 만료까지 유지하는 정책이면 13(만료)만 봐야 하지만,
  // Paymentwall 은 기간 종료 시 13 을 따로 보내므로 12 에서는 내리지 않는다.
  if (
    type === PINGBACK_TYPE.CHARGEBACK ||
    type === PINGBACK_TYPE.SUBSCRIPTION_EXPIRED ||
    type === PINGBACK_TYPE.RENEWAL_FAILED
  ) {
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings || settings.plan === "free") {
      return new NextResponse("OK", { status: 200 });
    }

    // 관리자/추천 등으로 부여된 한시 요금제가 살아 있으면 PW 이벤트로 내리지 않는다.
    if (
      settings.grantedPlan &&
      settings.grantedPlanUntil &&
      settings.grantedPlanUntil.getTime() > Date.now()
    ) {
      console.info("paymentwall pingback: skip downgrade — grantedPlan active", {
        userId,
        type,
      });
      return new NextResponse("OK", { status: 200 });
    }

    // 이 사용자에 대한 Paymentwall 결제 증거가 있을 때만 다운그레이드
    const pwOrder = params.ref
      ? await prisma.order.findFirst({
          where: { userId, providerRef: params.ref },
        })
      : await prisma.order.findFirst({
          where: { userId, status: "paid", providerRef: { not: null } },
          orderBy: { createdAt: "desc" },
        });
    if (!pwOrder) {
      console.warn("paymentwall pingback: skip downgrade — no matching paid order", {
        userId,
        type,
        ref: params.ref,
      });
      return new NextResponse("OK", { status: 200 });
    }

    await prisma.userSettings.updateMany({
      where: { userId, plan: { not: "free" } },
      data: { plan: "free" },
    });
    console.info("paymentwall pingback: 요금제 해제", { userId, type, orderId: pwOrder.id });
    return new NextResponse("OK", { status: 200 });
  }

  // 해지 예약(12) 등 나머지는 기록만 남기고 권한은 건드리지 않는다.
  console.info("paymentwall pingback: 처리 대상 아님", { type, ref: params.ref });
  return new NextResponse("OK", { status: 200 });
}

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  return handle(params);
}

export async function POST(request: Request) {
  const body = await request.text();
  const params = Object.fromEntries(new URLSearchParams(body));
  return handle(params);
}
