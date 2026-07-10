import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_SETTINGS = {
  plan: "free",
  language: "ko",
  enabledQuickTools: null as Record<string, boolean> | null,
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const settings = await prisma.userSettings.findUnique({ where: { userId: session.user.id } });
    return NextResponse.json({
      plan: settings?.plan ?? DEFAULT_SETTINGS.plan,
      language: settings?.language ?? DEFAULT_SETTINGS.language,
      enabledQuickTools: settings?.enabledQuickTools ?? DEFAULT_SETTINGS.enabledQuickTools,
    });
  } catch (err) {
    console.error("get settings error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}

/** 언어 · 퀵툴 on/off만 사용자가 직접 바꿀 수 있다. plan(요금제)은 결제 플로우 전용이라
 * 여기서는 읽기만 지원하고 쓰기는 막아둔다. */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const data: { language?: string; enabledQuickTools?: Record<string, boolean> } = {};
  if (body.language === "ko" || body.language === "en") data.language = body.language;
  if (body.enabledQuickTools && typeof body.enabledQuickTools === "object") {
    data.enabledQuickTools = body.enabledQuickTools;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "변경할 값이 없습니다." }, { status: 400 });
  }

  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...data },
      update: data,
    });
    return NextResponse.json({
      plan: settings.plan,
      language: settings.language,
      enabledQuickTools: settings.enabledQuickTools,
    });
  } catch (err) {
    console.error("update settings error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
