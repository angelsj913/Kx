import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlan, newMerchantUid } from "@/lib/plans";
import { getStripe, getBaseUrl } from "@/lib/stripe";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    // 요금제 권한은 계정에 붙으므로 로그인 필수
    if (!userId) {
      return NextResponse.json(
        { error: "결제를 위해 로그인이 필요합니다.", needLogin: true },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const plan = getPlan(body?.plan);
    if (!plan) {
      return NextResponse.json({ error: "알 수 없는 요금제입니다." }, { status: 400 });
    }

    const merchantUid = newMerchantUid();
    const stripe = getStripe();
    const baseUrl = getBaseUrl();

    // 주문 기록 발행
    await prisma.order.create({
      data: {
        merchantUid,
        userId,
        plan: plan.id,
        amount: plan.amount,
        currency: plan.currency,
        status: "pending",
      },
    });

    // Stripe 키가 없으면 스텁 모드 — 완료 페이지에서 결제 확인 후 권한 부여
    if (!stripe) {
      return NextResponse.json({
        ok: true,
        stub: true,
        merchantUid,
        // 프론트가 바로 완료(시뮬) 페이지로 이동할 수 있게 URL 제공
        completeUrl: `/checkout/complete?uid=${encodeURIComponent(merchantUid)}&stub=1`,
      });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            product_data: { name: `ZEFF AI ${plan.label}` },
            unit_amount: plan.amount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      client_reference_id: merchantUid,
      metadata: { merchantUid, plan: plan.id, userId },
      success_url: `${baseUrl}/checkout/complete?uid=${encodeURIComponent(merchantUid)}`,
      cancel_url: `${baseUrl}/checkout?plan=${plan.id}&canceled=1`,
      customer_email: session.user?.email ?? undefined,
    });

    await prisma.order.update({
      where: { merchantUid },
      data: { stripeSession: checkout.id },
    });

    return NextResponse.json({ ok: true, url: checkout.url, merchantUid });
  } catch (err) {
    console.error("checkout error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
