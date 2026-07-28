import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlan, newMerchantUid } from "@/lib/plans";
import { isStubCheckoutAllowed, getBaseUrl } from "@/lib/billing";
import { buildWidgetUrl } from "@/lib/paymentwall";
import { assertRateLimit, clientIp, RateLimitError } from "@/lib/rateLimit";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // 카드 테스팅 방어 — 결제창을 여는 지점이라 봇이 훔친 카드 목록을 대량으로
    // 검증하는 표적이 된다. 계정을 갈아타며 시도하는 패턴은 사용자 단위로는 안
    // 잡히므로 IP 를 먼저 본다. 로그인 검사보다 앞에 두어야 미인증 폭주도 걸린다.
    await assertRateLimit("checkout:ip", clientIp(request), { max: 30, windowSeconds: 600 });

    const session = await auth();
    const userId = session?.user?.id ?? null;

    // 요금제 권한은 계정에 붙으므로 로그인 필수
    if (!userId) {
      return NextResponse.json(
        { error: "결제를 위해 로그인이 필요합니다.", needLogin: true },
        { status: 401 }
      );
    }

    // 정상 사용자는 결제창을 몇 번 여닫는 정도다. 취소 후 재시도 여유는 두되,
    // 한 계정으로 카드를 바꿔가며 반복하는 시도는 여기서 끊는다.
    await assertRateLimit("checkout:user", userId, { max: 8, windowSeconds: 600 });

    const body = await request.json().catch(() => ({}));
    const plan = getPlan(body?.plan);
    if (!plan) {
      return NextResponse.json({ error: "알 수 없는 요금제입니다." }, { status: 400 });
    }

    const chargeAmount = plan.amount;

    // 이미 유료 구독 중이면 결제를 새로 열지 않는다. 열면 구독이 2개가 되어 매달 두 번
    // 청구된다. grantedPlan(추천 보상)은 보지 않는다 — 보상으로 받은 사용자도 결제는 할 수 있어야 한다.
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (settings?.plan && settings.plan !== "free") {
      return NextResponse.json(
        {
          error: "이미 구독 중입니다. 요금제 변경과 해지는 고객센터로 문의해 주세요.",
          manageSubscription: true,
          currentPlan: settings.plan,
        },
        { status: 409 }
      );
    }

    // 결제 불가 조건은 주문 발행 전에 거른다. 뒤로 미루면 결제할 수 없는 주문만
    // pending 으로 쌓인다.
    const baseUrl = getBaseUrl();
    const widgetUrl = buildWidgetUrl({
      userId,
      plan: plan.id as "pro" | "professional",
      email: session?.user?.email ?? undefined,
      successUrl: `${baseUrl}/checkout/complete`,
      failureUrl: `${baseUrl}/checkout?plan=${plan.id}&canceled=1`,
    });

    // 위젯 URL 을 못 만들면(키 미설정) 결제할 수 없다. 스텁은 개발/프리뷰 전용.
    if (!widgetUrl && !isStubCheckoutAllowed()) {
      console.error("checkout error: PAYMENTWALL_* 환경변수 누락");
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

    if (widgetUrl) {
      // 권한 부여는 pingback 이 담당한다. 완료 페이지는 결과 안내만 한다.
      return NextResponse.json({ ok: true, url: widgetUrl, merchantUid });
    }

    // 키 미설정 + 개발/프리뷰 — 스텁으로 완료 페이지에서 권한 부여
    return NextResponse.json({
      ok: true,
      stub: true,
      merchantUid,
      completeUrl: `/checkout/complete?uid=${encodeURIComponent(merchantUid)}&stub=1`,
    });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error("checkout error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
