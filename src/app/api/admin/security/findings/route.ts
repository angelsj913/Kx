import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSecurityAdmin, parseEnabledChecks } from "@/lib/security/program";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireSecurityAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const severity = url.searchParams.get("severity");
  const take = Math.min(Number(url.searchParams.get("take") || 50), 200);

  const findings = await prisma.securityFinding.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(severity ? { severity } : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
    take,
    include: {
      scan: { select: { id: true, createdAt: true, score: true } },
    },
  });

  return NextResponse.json({
    findings: findings.map((f) => ({
      ...f,
      skillIds: parseEnabledChecks(f.skillIds),
    })),
  });
}
