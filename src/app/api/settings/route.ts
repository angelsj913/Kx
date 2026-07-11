import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLANS = ["free", "pro", "professional"];
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
  const data: { plan?: string; language?: string; enabledQuickTools?: string[] } = {};

  if (typeof body?.plan === "string") {
    if (!PLANS.includes(body.plan)) {
      return NextResponse.json({ error: "알 수 없는 요금제입니다." }, { status: 400 });
    }
    data.plan = body.plan;
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
