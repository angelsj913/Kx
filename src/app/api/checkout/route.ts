import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlan, newMerchantUid } from "@/lib/plans";
import { getStripe, getBaseUrl, isStubCheckoutAllowed, priceIdFor } from "@/lib/stripe";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;
    const userEmail = session?.user?.email ?? undefined;

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

    // 결제 주기: 연간(year)이면 연간가로 청구, 그 외는 월간. 연간가 미지원 플랜은 월간으로 폴백.
    const isAnnual = body?.interval === "year" && plan.annualAmount != null;
    const interval: "month" | "year" = isAnnual ? "year" : "month";
    const chargeAmount = isAnnual ? (plan.annualAmount as number) : plan.amount;

    // 설정은 여기서 한 번만 읽어 가드·customer 재사용·결제창 locale 에 모두 쓴다.
    const settings = await prisma.userSettings.findUnique({ where: { userId } });

    // 이미 유료 구독 중이면 새 Checkout 을 만들지 않는다. 만들면 구독이 2개가 되어
    // 매달 두 번 청구된다. 플랜 변경·해지는 고객 포털이 담당한다.
    // grantedPlan(추천 보상)은 보지 않는다 — 보상으로 받은 사용자도 결제는 할 수 있어야 한다.
    if (settings?.plan && settings.plan !== "free") {
      return NextResponse.json(
        {
          error: "이미 구독 중입니다. 요금제 변경과 해지는 구독 관리에서 진행해 주세요.",
          manageSubscription: true,
        },
        { status: 409 }
      );
    }

    const stripe = getStripe();
    const baseUrl = getBaseUrl();

    // Price ID 확인은 주문 발행 전에. 뒤로 미루면 결제 불가한 주문만 pending 으로 쌓인다.
    const priceId = stripe ? priceIdFor(plan.id, interval) : undefined;
    if (stripe && !priceId) {
      console.error(`checkout error: STRIPE_PRICE_${plan.id.toUpperCase()}_${interval.toUpperCase()} missing`);
      return NextResponse.json(
        { error: "결제 시스템 점검 중입니다. 잠시 후 다시 시도해 주세요." },
        { status: 503 }
      );
    }

    const merchantUid = newMerchantUid();

    // 주문 기록 발행
    await prisma.order.create({
      data: {
        merchantUid,
        userId,
        plan: plan.id,
        amount: chargeAmount,
        currency: plan.currency,
        status: "pending",
      },
    });

    // Stripe 키가 없으면 스텁 모드 — 완료 페이지에서 결제 확인 후 권한 부여
    // (개발/프리뷰 전용. 프로덕션에서는 실제 결제 없이 요금제가 부여되지 않도록 차단)
    if (!stripe) {
      if (!isStubCheckoutAllowed()) {
        console.error("checkout error: STRIPE_SECRET_KEY missing in production");
        return NextResponse.json(
          { error: "결제 시스템 점검 중입니다. 잠시 후 다시 시도해 주세요." },
          { status: 503 }
        );
      }
      return NextResponse.json({
        ok: true,
        stub: true,
        merchantUid,
        // 프론트가 바로 완료(시뮬) 페이지로 이동할 수 있게 URL 제공
        completeUrl: `/checkout/complete?uid=${encodeURIComponent(merchantUid)}&stub=1`,
      });
    }

    // 워크스페이스 설정 언어 → Stripe 결제창 locale 동기화
    const lang = settings?.language || "ko";
    const stripeLocaleMap: Record<string, string> = {
      ko: "ko",
      en: "en",
      ja: "ja",
      zh: "zh",
      de: "de",
      fr: "fr",
      es: "es",
      ru: "ru",
    };
    const locale = (stripeLocaleMap[lang] || "auto") as
      | "ko"
      | "en"
      | "ja"
      | "zh"
      | "de"
      | "fr"
      | "es"
      | "ru"
      | "auto";

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      locale,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: merchantUid,
      metadata: { merchantUid, plan: plan.id, userId, interval },
      success_url: `${baseUrl}/checkout/complete?uid=${encodeURIComponent(merchantUid)}`,
      cancel_url: `${baseUrl}/checkout?plan=${plan.id}&canceled=1`,
      // Customer 를 재사용해야 카드·영수증 이력이 한 고객에 모이고 포털이 열린다.
      // customer 와 customer_email 을 함께 주면 Stripe 가 거부하므로 택일.
      ...(settings?.stripeCustomerId
        ? { customer: settings.stripeCustomerId }
        : { customer_email: userEmail }),
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
