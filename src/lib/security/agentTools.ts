import { prisma } from "@/lib/prisma";
import { type AgentToolSpec } from "@/lib/agentTools";

function safeJsonArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

const GET_LATEST_SCAN: AgentToolSpec = {
  name: "getLatestScan",
  description:
    "가장 최근 완료된 보안 스캔의 점수·요약·Finding 수를 조회한다. 스캔 현황을 말할 때 사용.",
  parameters: { type: "object", properties: {}, required: [] },
  async run() {
    const scan = await prisma.securityScan.findFirst({
      where: { status: "completed" },
      orderBy: { createdAt: "desc" },
      include: {
        findings: {
          select: { id: true, severity: true, result: true, status: true, checkId: true, title: true },
        },
      },
    });
    if (!scan) {
      return { terminal: false, text: "완료된 스캔이 없습니다. 관리자가 먼저 스캔을 실행해야 합니다." };
    }
    const open = scan.findings.filter((f) => f.status === "open" && f.result !== "pass");
    const bySev = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const f of open) {
      if (f.severity in bySev) bySev[f.severity as keyof typeof bySev] += 1;
    }
    return {
      terminal: false,
      text: JSON.stringify(
        {
          scanId: scan.id,
          score: scan.score,
          createdAt: scan.createdAt,
          openBySeverity: bySev,
          openFindings: open.slice(0, 20).map((f) => ({
            findingId: f.id,
            checkId: f.checkId,
            severity: f.severity,
            title: f.title,
          })),
        },
        null,
        2,
      ),
    };
  },
};

const LIST_FINDINGS: AgentToolSpec = {
  name: "listFindings",
  description:
    "열린(open) 보안 Finding 목록을 조회한다. severity로 필터할 수 있다.",
  parameters: {
    type: "object",
    properties: {
      severity: {
        type: "string",
        description: "critical | high | medium | low | info (선택)",
      },
      limit: {
        type: "number",
        description: "최대 개수 (기본 30, 최대 50)",
      },
    },
    required: [],
  },
  async run(args) {
    const severity = String(args.severity ?? "").trim().toLowerCase();
    const limit = Math.min(50, Math.max(1, Number(args.limit) || 30));
    const findings = await prisma.securityFinding.findMany({
      where: {
        status: "open",
        result: { not: "pass" },
        ...(severity ? { severity } : {}),
      },
      orderBy: [{ severity: "asc" }, { updatedAt: "desc" }],
      take: limit,
      select: {
        id: true,
        checkId: true,
        severity: true,
        title: true,
        detail: true,
        remediation: true,
        skillIds: true,
        scanId: true,
        status: true,
        result: true,
      },
    });
    return {
      terminal: false,
      text: JSON.stringify(
        {
          count: findings.length,
          findings: findings.map((f) => ({
            findingId: f.id,
            scanId: f.scanId,
            checkId: f.checkId,
            severity: f.severity,
            title: f.title,
            detail: f.detail,
            remediation: f.remediation,
            skillIds: safeJsonArray(f.skillIds),
            result: f.result,
          })),
        },
        null,
        2,
      ),
    };
  },
};

const GET_SKILL_SUMMARY: AgentToolSpec = {
  name: "getSkillSummary",
  description:
    "큐레이션된 보안 스킬 id의 요약(제목·설명·도메인·태그·연결 checkIds)을 가져온다.",
  parameters: {
    type: "object",
    properties: {
      id: { type: "string", description: "스킬 id (예: testing-api-authentication-weaknesses)" },
    },
    required: ["id"],
  },
  async run(args) {
    const id = String(args.id ?? "").trim();
    if (!id) return { terminal: false, text: "스킬 id가 비어 있습니다." };
    const skill = await prisma.securitySkillRef.findUnique({ where: { id } });
    if (!skill) {
      return {
        terminal: false,
        text: `스킬을 찾을 수 없습니다: ${id}. 카탈로그에 있는 id만 사용하세요.`,
      };
    }
    return {
      terminal: false,
      text: JSON.stringify(
        {
          skillId: skill.id,
          title: skill.title,
          description: skill.description,
          domain: skill.domain,
          tags: safeJsonArray(skill.tags),
          checkIds: safeJsonArray(skill.checkIds),
        },
        null,
        2,
      ),
    };
  },
};

export function buildSecurityAgentTools(): AgentToolSpec[] {
  return [GET_LATEST_SCAN, LIST_FINDINGS, GET_SKILL_SUMMARY];
}
