import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { getStripe, getBaseUrl } from "@/lib/stripe";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe 고객 포털 진입 URL 발급.
 * 해지·플랜 변경·영수증은 전부 여기서 처리한다 — 자체 UI 를 만들지 않는 이유는
 * 결제 상태의 단일 진실이 Stripe 쪽에 있기 때문이다.
 */
export async function POST() {
  try {
    const userId = await requireUserId();
    if (userId instanceof NextResponse) return userId;

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "결제 시스템 점검 중입니다. 잠시 후 다시 시도해 주세요." },
        { status: 503 }
      );
    }

    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings?.stripeCustomerId) {
      return NextResponse.json(
        { error: "연결된 구독 정보가 없습니다. 결제 내역이 있다면 고객센터로 문의해 주세요." },
        { status: 404 }
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: settings.stripeCustomerId,
      return_url: `${getBaseUrl()}/app`,
    });

    return NextResponse.json({ ok: true, url: portal.url });
  } catch (err) {
    console.error("billing portal error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
