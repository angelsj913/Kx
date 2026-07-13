import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
  const holder = String(body?.holder ?? "").trim().slice(0, 80) || null;

  if (last4.length !== 4) {
    return NextResponse.json({ error: "카드 번호 뒤 4자리를 입력해 주세요." }, { status: 400 });
  }

  const method = await prisma.savedPaymentMethod.create({
    data: { userId: session.user.id, brand, last4, holder },
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

  const count = await prisma.savedPaymentMethod.count({
    where: { userId: session.user.id },
  });
  if (count <= 1) {
    return NextResponse.json(
      { error: "결제수단이 1개일 때는 해지할 수 없습니다." },
      { status: 400 },
    );
  }

  const existing = await prisma.savedPaymentMethod.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "결제수단을 찾을 수 없습니다." }, { status: 404 });
  }
  await prisma.savedPaymentMethod.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
