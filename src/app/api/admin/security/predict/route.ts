import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/requireAdmin";
import { detectThreats } from "@/lib/threatRules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [loginWeek, threats, openThreats, rateHits] = await Promise.all([
    prisma.loginEvent.count({ where: { createdAt: { gte: weekAgo } } }),
    detectThreats(),
    prisma.securityThreatEvent.count({ where: { resolvedAt: null } }),
    prisma.rateLimitHit.count({ where: { updatedAt: { gte: weekAgo }, count: { gte: 5 } } }),
  ]);

  const score = Math.min(
    100,
    openThreats * 15 + threats.filter((t) => t.severity === "high").length * 20 + rateHits * 2,
  );

  return NextResponse.json({
    score,
    riskLevel: score >= 60 ? "high" : score >= 30 ? "medium" : "low",
    loginWeek,
    openThreats,
    rateHits,
    recommendations: [
      openThreats > 0 ? "미해결 위험 이벤트를 검토하고 resolve 처리하세요." : null,
      rateHits > 5 ? "Rate limit hit이 증가했습니다. 홈페이지 OTP 한도를 점검하세요." : null,
      "관리자 MFA(8h)를 유지하고 48h 백업 스케줄을 확인하세요.",
    ].filter(Boolean),
    detectedNow: threats,
  });
}
