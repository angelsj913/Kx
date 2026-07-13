import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUsageSummary } from "@/lib/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const summary = await getUsageSummary(session.user.id);
  return NextResponse.json(summary);
}
