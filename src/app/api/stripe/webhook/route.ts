import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, planForPriceId } from "@/lib/stripe";
import { fulfillPaidOrder } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 구독 이벤트의 customer 필드는 id 문자열이거나 확장된 객체다. */
function customerIdOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    // 200 을 돌려주면 Stripe 는 "배달 완료"로 보고 재시도하지 않는다 — 결제 이벤트가
    // 영구 소실된다. 프로덕션에서는 500 으로 실패를 알려 재시도를 받아낸다.
    if (process.env.NODE_ENV === "production") {
      console.error("stripe webhook: STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET missing in production");
      return NextResponse.json({ error: "webhook not configured" }, { status: 500 });
    }
    // 개발/프리뷰: 결제 연동 전이라 조용히 무시
    return NextResponse.json({ ok: true, stub: true });
  }

  const sig = request.headers.get("stripe-signature");
  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig ?? "", webhookSecret);
  } catch (err) {
    console.error("stripe webhook signature error:", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const merchantUid = session.metadata?.merchantUid || session.client_reference_id || "";
    const userId = session.metadata?.userId || "";

    if (merchantUid) {
      const result = await fulfillPaidOrder({
        merchantUid,
        userId: userId || null,
        stripeSession: session.id,
        stripeCustomerId: customerIdOf(session.customer),
        source: "stripe_webhook",
      });
      if (!result.ok) {
        console.error("fulfill from webhook failed:", result.error, merchantUid);
      }
    }
  }

  // 포털에서 플랜을 바꾸면 앱에 반영되는 경로는 이 이벤트뿐이다.
  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = customerIdOf(sub.customer);
    const priceId = sub.items.data[0]?.price?.id;
    const plan = priceId ? planForPriceId(priceId) : undefined;
    if (customerId && plan) {
      // 해지 예약(cancel_at_period_end)은 아직 이용 기간이 남아 있으므로 플랜을 유지한다.
      // 실제 종료는 customer.subscription.deleted 로 온다.
      await prisma.userSettings.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan },
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = customerIdOf(sub.customer);
    if (customerId) {
      await prisma.userSettings.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan: "free" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
