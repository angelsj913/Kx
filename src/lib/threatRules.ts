import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type ThreatSeverity = "low" | "medium" | "high" | "critical";

export type DetectedThreat = {
  type: string;
  severity: ThreatSeverity;
  title: string;
  summary: string;
  source?: string;
  meta?: Prisma.InputJsonValue;
};

/** LoginEvent·RateLimitHit 등에서 규칙 기반 위험 탐지 */
export async function detectThreats(): Promise<DetectedThreat[]> {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threats: DetectedThreat[] = [];

  const [recentLogins, rateLimits, failedBackup, aiDisabled] = await Promise.all([
    prisma.loginEvent.findMany({
      where: { createdAt: { gte: hourAgo } },
      select: { ip: true, userId: true, userAgent: true },
    }),
    prisma.rateLimitHit.findMany({
      where: { updatedAt: { gte: hourAgo }, count: { gte: 5 } },
      orderBy: { count: "desc" },
      take: 20,
    }),
    prisma.backupRecord.findFirst({
      where: { status: "completed" },
      orderBy: { completedAt: "desc" },
    }),
    prisma.userSettings.count({ where: { aiDisabled: true } }),
  ]);

  const ipCounts = new Map<string, number>();
  for (const e of recentLogins) {
    const ip = e.ip ?? "unknown";
    ipCounts.set(ip, (ipCounts.get(ip) ?? 0) + 1);
  }
  for (const [ip, count] of ipCounts) {
    if (count >= 10 && ip !== "unknown") {
      threats.push({
        type: "login_burst",
        severity: count >= 20 ? "high" : "medium",
        title: `동일 IP 집중 로그인 (${ip})`,
        summary: `최근 1시간 내 IP ${ip}에서 ${count}회 로그인 시도`,
        source: ip,
        meta: { count, window: "1h" },
      });
    }
  }

  for (const r of rateLimits) {
    if (r.count >= 10) {
      threats.push({
        type: "rate_limit",
        severity: r.count >= 20 ? "high" : "medium",
        title: `Rate limit 초과: ${r.scope}`,
        summary: `${r.identifier} — ${r.count}회 (${r.windowKey})`,
        source: r.scope,
        meta: { identifier: r.identifier, count: r.count },
      });
    }
  }

  if (!failedBackup?.completedAt || failedBackup.completedAt < dayAgo) {
    threats.push({
      type: "backup_stale",
      severity: "medium",
      title: "백업 지연",
      summary: failedBackup?.completedAt
        ? `마지막 성공 백업: ${failedBackup.completedAt.toISOString()}`
        : "성공한 백업 이력이 없습니다.",
      source: "backup",
    });
  }

  if (aiDisabled >= 5) {
    threats.push({
      type: "ai_disabled_spike",
      severity: "low",
      title: "AI 차단 사용자 증가",
      summary: `현재 ${aiDisabled}명의 AI가 관리자에 의해 비활성화됨`,
      source: "ai",
      meta: { count: aiDisabled },
    });
  }

  return threats;
}

export async function persistThreats(threats: DetectedThreat[]) {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const created = [];
  for (const t of threats) {
    const dup = await prisma.securityThreatEvent.findFirst({
      where: {
        type: t.type,
        source: t.source ?? null,
        createdAt: { gte: hourAgo },
        resolvedAt: null,
      },
    });
    if (dup) continue;
    const row = await prisma.securityThreatEvent.create({
      data: {
        type: t.type,
        severity: t.severity,
        title: t.title,
        summary: t.summary,
        source: t.source ?? null,
        meta: t.meta === undefined ? undefined : (t.meta as Prisma.InputJsonValue),
      },
    });
    created.push(row);
  }
  return created;
}

export async function runThreatScan() {
  const detected = await detectThreats();
  const created = await persistThreats(detected);
  return { detected: detected.length, created: created.length, events: created };
}

export function severityColor(severity: string) {
  switch (severity) {
    case "critical":
      return "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-950";
    case "high":
      return "text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-950";
    case "medium":
      return "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950";
    default:
      return "text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800";
  }
}
