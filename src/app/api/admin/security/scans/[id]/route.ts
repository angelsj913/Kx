import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSecurityAdmin, parseEnabledChecks } from "@/lib/security/program";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const session = await requireSecurityAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const scan = await prisma.securityScan.findUnique({
    where: { id },
    include: { findings: { orderBy: [{ result: "asc" }, { severity: "asc" }] } },
  });
  if (!scan) {
    return NextResponse.json({ error: "스캔을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({
    scan: {
      ...scan,
      findings: scan.findings.map((f) => ({
        ...f,
        skillIds: parseEnabledChecks(f.skillIds),
      })),
    },
  });
}
