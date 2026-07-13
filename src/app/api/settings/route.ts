import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LANGUAGES = ["ko", "en"];

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

  return NextResponse.json({ settings });
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
      (v: unknown): v is string => typeof v === "string"
    );
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });

  return NextResponse.json({ settings });
}
