import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlan, newMerchantUid } from "@/lib/plans";
import { isStubCheckoutAllowed } from "@/lib/billing";
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

    // 결제 주기: 연간(year)이면 연간가로 청구, 그 외는 월간. 연간가 미지원 플랜은 월간으로 폴백.
    const isAnnual = body?.interval === "year" && plan.annualAmount != null;
    const chargeAmount = isAnnual ? (plan.annualAmount as number) : plan.amount;

    // 이미 유료 구독 중이면 결제를 새로 열지 않는다. 열면 구독이 2개가 되어 매달 두 번
    // 청구된다. grantedPlan(추천 보상)은 보지 않는다 — 보상으로 받은 사용자도 결제는 할 수 있어야 한다.
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (settings?.plan && settings.plan !== "free") {
      return NextResponse.json(
        {
          error: "이미 구독 중입니다. 요금제 변경과 해지는 고객센터로 문의해 주세요.",
          manageSubscription: true,
        },
        { status: 409 }
      );
    }

    // 결제 불가 조건은 주문 발행 전에 거른다. 뒤로 미루면 결제할 수 없는 주문만
    // pending 으로 쌓인다. 결제대행사 연동 전이라 프로덕션에서는 여기서 끝난다.
    if (!isStubCheckoutAllowed()) {
      console.error("checkout error: 결제대행사 미연동");
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

    // 결제대행사 미연동 — 스텁 모드로 완료 페이지에서 권한 부여.
    // 개발/프리뷰 전용이며, 프로덕션은 위 가드에서 이미 걸러졌다.
    return NextResponse.json({
      ok: true,
      stub: true,
      merchantUid,
      // 프론트가 바로 완료(시뮬) 페이지로 이동할 수 있게 URL 제공
      completeUrl: `/checkout/complete?uid=${encodeURIComponent(merchantUid)}&stub=1`,
    });
  } catch (err) {
    console.error("checkout error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
