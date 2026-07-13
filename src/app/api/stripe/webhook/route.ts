import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { fulfillPaidOrder } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    // 스텁 모드: 결제 연동 전에는 웹훅을 조용히 무시
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
        source: "stripe_webhook",
      });
      if (!result.ok) {
        console.error("fulfill from webhook failed:", result.error, merchantUid);
      }
    }
  }

  return NextResponse.json({ received: true });
}
