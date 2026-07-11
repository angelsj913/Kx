import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

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
    const plan = session.metadata?.plan || "";
    const userId = session.metadata?.userId || "";

    if (merchantUid) {
      await prisma.order.updateMany({
        where: { merchantUid },
        data: {
          status: "paid",
          stripeSession: session.id,
        },
      });
    }
    // 유저 등급 즉시 갱신
    if (userId && plan) {
      await prisma.userSettings.upsert({
        where: { userId },
        create: { userId, plan },
        update: { plan },
      });
    }
  }

  return NextResponse.json({ received: true });
}
