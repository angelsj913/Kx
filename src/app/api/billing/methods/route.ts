import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanOrFree } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 자체 결제수단 목록 (플랫폼 연동 전 로컬) */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const methods = await prisma.savedPaymentMethod.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ methods });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const brand = String(body?.brand ?? "card").trim().toLowerCase() || "card";
  const last4 = String(body?.last4 ?? "").replace(/\D/g, "").slice(-4);

  if (last4.length !== 4) {
    return NextResponse.json({ error: "카드 번호 뒤 4자리를 입력해 주세요." }, { status: 400 });
  }

  // 카드 종류·뒤 4자리만 저장한다(소유자 이름 등 추가 개인정보는 수집하지 않음).
  const method = await prisma.savedPaymentMethod.create({
    data: { userId: session.user.id, brand, last4 },
  });
  return NextResponse.json({ method });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const id = String(body?.id ?? "");
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

  const existing = await prisma.savedPaymentMethod.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "결제수단을 찾을 수 없습니다." }, { status: 404 });
  }

  // 유료 구독 중이면 마지막 결제수단은 지울 수 없다 — 요금제를 먼저 해지해야 한다.
  // 무료 사용자는 마지막 카드까지 자유롭게 해지할 수 있다.
  const [count, settings] = await Promise.all([
    prisma.savedPaymentMethod.count({ where: { userId: session.user.id } }),
    prisma.userSettings.findUnique({ where: { userId: session.user.id } }),
  ]);
  const plan = getPlanOrFree(settings?.plan);
  if (plan.id !== "free" && count <= 1) {
    return NextResponse.json(
      {
        error:
          "유료 요금제를 이용 중이라 마지막 결제수단은 해지할 수 없어요. 먼저 요금제를 무료로 변경한 뒤 다시 시도해 주세요.",
        needsPlanCancel: true,
      },
      { status: 409 },
    );
  }

  await prisma.savedPaymentMethod.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
