import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPersona } from "@/lib/personas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const conversations = await prisma.chatConversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, personaId: true, title: true, updatedAt: true, createdAt: true },
  });

  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const persona = getPersona(body?.personaId);

  const conversation = await prisma.chatConversation.create({
    data: { userId: session.user.id, personaId: persona.id },
  });

  return NextResponse.json({ conversation });
}
