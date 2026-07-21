import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LANGUAGE_ORDER } from "@/lib/languages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 지원 언어 단일 소스(아랍어 포함) — 여기서 배열을 따로 관리하면 언어가 추가될 때
// 저장 API만 뒤처져 특정 언어(예: 아랍어) 저장이 400으로 막히는 버그가 생긴다.
const LANGUAGES: readonly string[] = LANGUAGE_ORDER;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id },
  });

  const enabledQuickTools = Array.isArray(settings.enabledQuickTools)
    ? (settings.enabledQuickTools as string[]).filter((id) => id !== "agent")
    : settings.enabledQuickTools;

  return NextResponse.json({
    settings: { ...settings, enabledQuickTools },
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const data: { language?: string; enabledQuickTools?: string[] } = {};

  // 요금제(plan)는 결제 완료(fulfillPaidOrder)로만 변경 — 클라이언트 임의 변경 차단
  if (typeof body?.plan === "string") {
    return NextResponse.json(
      {
        error: "요금제는 결제 완료 후 자동 적용됩니다. /checkout 에서 결제해 주세요.",
        code: "PLAN_VIA_CHECKOUT",
      },
      { status: 403 }
    );
  }
  if (typeof body?.language === "string") {
    if (!LANGUAGES.includes(body.language)) {
      return NextResponse.json({ error: "지원하지 않는 언어입니다." }, { status: 400 });
    }
    data.language = body.language;
  }
  if (Array.isArray(body?.enabledQuickTools)) {
    data.enabledQuickTools = body.enabledQuickTools.filter(
      (v: unknown): v is string => typeof v === "string" && v !== "agent",
    );
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });

  return NextResponse.json({ settings });
}
