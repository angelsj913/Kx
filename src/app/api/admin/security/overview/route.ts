import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireSecurityAdmin,
  getOrCreateSecuritySettings,
  parseEnabledChecks,
} from "@/lib/security/program";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireSecurityAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [latest, openFindings, settings, twoFaOn, twoFaTotal] = await Promise.all([
    prisma.securityScan.findFirst({
      where: { status: "completed" },
      orderBy: { createdAt: "desc" },
      include: {
        findings: { orderBy: [{ severity: "asc" }, { createdAt: "desc" }], take: 10 },
      },
    }),
    prisma.securityFinding.groupBy({
      by: ["severity"],
      where: { status: "open", result: { not: "pass" } },
      _count: { _all: true },
    }),
    getOrCreateSecuritySettings(),
    prisma.user.count({ where: { twoFactorEnabled: true } }),
    prisma.user.count(),
  ]);

  const openBySeverity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const row of openFindings) {
    const k = row.severity as keyof typeof openBySeverity;
    if (k in openBySeverity) openBySeverity[k] = row._count._all;
  }

  const recentFindings =
    latest?.findings.map((f) => ({
      ...f,
      skillIds: parseEnabledChecks(f.skillIds),
    })) ?? [];

  return NextResponse.json({
    score: latest?.score ?? null,
    lastScanAt: latest?.createdAt ?? null,
    lastScanId: latest?.id ?? null,
    openBySeverity,
    recentFindings,
    twoFaAdoption:
      twoFaTotal > 0 ? Math.round((twoFaOn / twoFaTotal) * 100) : 0,
    settings: {
      notifyOnCritical: settings.notifyOnCritical,
      enabledChecks: parseEnabledChecks(settings.enabledChecksJson),
    },
  });
}
