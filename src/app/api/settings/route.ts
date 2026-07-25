import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { LANGUAGE_ORDER } from "@/lib/languages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 지원 언어 단일 소스(아랍어 포함) — 여기서 배열을 따로 관리하면 언어가 추가될 때
// 저장 API만 뒤처져 특정 언어(예: 아랍어) 저장이 400으로 막히는 버그가 생긴다.
const LANGUAGES: readonly string[] = LANGUAGE_ORDER;
const TONES = ["balanced", "concise", "friendly", "professional", "teaching"] as const;

export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const settings = await prisma.userSettings.upsert({
    where: { userId: userId },
    update: {},
    create: { userId: userId },
  });

  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const body = await request.json().catch(() => ({}));
  const data: {
    language?: string;
    enabledQuickTools?: string[];
    memoryEnabled?: boolean;
    preferredTone?: string;
  } = {};

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
  if (typeof body?.memoryEnabled === "boolean") {
    data.memoryEnabled = body.memoryEnabled;
  }
  if (typeof body?.preferredTone === "string") {
    if (!(TONES as readonly string[]).includes(body.preferredTone)) {
      return NextResponse.json({ error: "지원하지 않는 AI 성격입니다." }, { status: 400 });
    }
    data.preferredTone = body.preferredTone;
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId: userId },
    update: data,
    create: { userId: userId, ...data },
  });

  return NextResponse.json({ settings });
}
