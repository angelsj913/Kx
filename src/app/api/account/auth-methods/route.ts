import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/apiAuth";
import { buildAuthMethods } from "@/lib/accountAuthMethods";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      passwordHash: true,
      accounts: {
        where: { provider: "google" },
        select: { provider: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  return NextResponse.json(buildAuthMethods(user));
}
