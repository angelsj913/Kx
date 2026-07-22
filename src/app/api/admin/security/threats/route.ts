import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/requireAdmin";
import { runThreatScan } from "@/lib/threatRules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;

  const url = new URL(request.url);
  if (url.searchParams.get("scan") === "1") {
    await runThreatScan();
  }

  const events = await prisma.securityThreatEvent.findMany({
    where: { resolvedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const counts = await prisma.securityThreatEvent.groupBy({
    by: ["severity"],
    where: { resolvedAt: null },
    _count: { _all: true },
  });

  return NextResponse.json({
    events,
    counts: Object.fromEntries(counts.map((c) => [c.severity, c._count._all])),
  });
}

export async function POST() {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;
  const result = await runThreatScan();
  return NextResponse.json(result);
}
