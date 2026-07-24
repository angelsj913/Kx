import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;
  const orders = await prisma.order.findMany({
    where: { userId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ orders });
}
