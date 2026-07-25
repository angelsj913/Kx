import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/apiAuth";
import { getUsageSummary } from "@/lib/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;
  const summary = await getUsageSummary(userId);
  return NextResponse.json(summary);
}
