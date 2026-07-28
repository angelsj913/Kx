import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/apiAuth";
import { googleUnlinkPrecondition } from "@/lib/accountAuthMethods";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const precondition = googleUnlinkPrecondition(user);
  if (!precondition.ok) {
    return NextResponse.json(
      { error: precondition.error },
      { status: precondition.status },
    );
  }

  await prisma.account.deleteMany({ where: { userId, provider: "google" } });
  return NextResponse.json({ ok: true });
}
