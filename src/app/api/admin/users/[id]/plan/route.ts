import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin";
import { isPlanId, type PlanId, PLANS, newMerchantUid } from "@/lib/plans";
import { issueOtp, verifyOtp } from "@/lib/otp";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * 관리자 회원 요금제 변경 (이메일 OTP 2단계 필수)
 *
 * POST body:
 *   { action: "send-otp", plan: "pro" }
 *   { action: "change", plan: "pro", code: "123456" }
 */
export async function POST(request: Request, ctx: RouteCtx) {
  try {
    const session = await auth();
    if (!isAdminSession(session)) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const adminEmail = (session.user.email ?? "").trim().toLowerCase();
    if (!adminEmail) {
      return NextResponse.json(
        { error: "관리자 이메일이 세션에 없습니다. 다시 로그인해 주세요." },
        { status: 400 }
      );
    }

    const { id: userId } = await ctx.params;
    if (!userId) {
      return NextResponse.json({ error: "회원 ID가 필요합니다." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body?.action as string;
    const planRaw = String(body?.plan ?? "").trim().toLowerCase();

    if (!isPlanId(planRaw)) {
      return NextResponse.json({ error: "알 수 없는 요금제입니다." }, { status: 400 });
    }
    const plan = planRaw as PlanId;

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        settings: { select: { plan: true } },
      },
    });
    if (!target) {
      return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
    }

    const currentPlan = (target.settings?.plan as PlanId | undefined) ?? "free";
    if (currentPlan === plan && action === "change") {
      return NextResponse.json({ error: "이미 해당 요금제입니다." }, { status: 400 });
    }

    // ── 1단계: 관리자 이메일로 OTP 발송 ──
    if (action === "send-otp") {
      const result = await issueOtp(adminEmail, "email", "admin-plan-change");
      const masked = maskEmail(adminEmail);

      // 메일 실패해도 관리자 작업은 막지 않음 — 화면 코드(devCode)로 2단계 진행
      const message = result.sent
        ? `${masked} 으로 인증번호를 보냈습니다. 3분 안에 입력해 주세요.`
        : result.devCode
          ? `메일 발송에 실패해 화면에 인증번호를 표시합니다. (${result.mailError ?? "발송 수단 확인 필요"})`
          : result.mailError ?? "인증번호 발송에 실패했습니다.";

      if (!result.sent && !result.devCode) {
        return NextResponse.json(
          {
            error: message,
            mailMode: result.mode,
            sent: false,
          },
          { status: 502 }
        );
      }

      return NextResponse.json({
        ok: true,
        sent: result.sent,
        mailMode: result.mode,
        sentTo: masked,
        targetUserId: target.id,
        targetEmail: target.email,
        fromPlan: currentPlan,
        toPlan: plan,
        // 메일 미발송 시 관리자 폴백 코드 (issueOtp 가 admin-plan-change 에 허용)
        devCode: result.devCode,
        mailError: result.mailError,
        message,
      });
    }

    // ── 2단계: OTP 검증 후 요금제 변경 ──
    if (action === "change") {
      const code = String(body?.code ?? "").trim();
      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json({ error: "6자리 인증번호를 입력해 주세요." }, { status: 400 });
      }

      const valid = await verifyOtp(adminEmail, "admin-plan-change", code);
      if (!valid) {
        return NextResponse.json(
          { error: "인증번호가 올바르지 않거나 만료되었습니다. 다시 발송해 주세요." },
          { status: 400 }
        );
      }

      const settings = await prisma.userSettings.upsert({
        where: { userId: target.id },
        create: { userId: target.id, plan },
        update: { plan },
      });

      // 감사 로그 (주문 목록에서 관리자 변경 내역 확인)
      const amount = plan === "free" ? 0 : PLANS[plan].amount;
      await prisma.order.create({
        data: {
          merchantUid: `ADMIN-${newMerchantUid().replace(/^ZEFF-/, "")}`,
          userId: target.id,
          plan,
          amount,
          currency: "krw",
          status: "paid",
        },
      });

      console.info(
        `[admin-plan] ${adminEmail} changed user ${target.id} (${target.email}) ${currentPlan} → ${plan}`
      );

      return NextResponse.json({
        ok: true,
        userId: target.id,
        plan: settings.plan,
        fromPlan: currentPlan,
        toPlan: plan,
        message: `요금제가 ${PLANS[plan].name} 으로 변경되었습니다.`,
      });
    }

    return NextResponse.json(
      { error: "action 은 send-otp 또는 change 여야 합니다." },
      { status: 400 }
    );
  } catch (err) {
    console.error("admin plan change error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  if (local.length <= 2) return `${local[0] ?? "*"}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}
