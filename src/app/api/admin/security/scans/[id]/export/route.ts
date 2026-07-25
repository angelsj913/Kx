import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSecurityAdmin, parseEnabledChecks } from "@/lib/security/program";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const session = await requireSecurityAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const format = new URL(request.url).searchParams.get("format") || "json";

  const scan = await prisma.securityScan.findUnique({
    where: { id },
    include: { findings: { orderBy: [{ severity: "asc" }, { result: "asc" }] } },
  });
  if (!scan) {
    return NextResponse.json({ error: "스캔을 찾을 수 없습니다." }, { status: 404 });
  }

  const findings = scan.findings.map((f) => ({
    id: f.id,
    checkId: f.checkId,
    skillIds: parseEnabledChecks(f.skillIds),
    severity: f.severity,
    title: f.title,
    detail: f.detail,
    remediation: f.remediation,
    result: f.result,
    status: f.status,
    waiveReason: f.waiveReason,
  }));

  const payload = {
    scanId: scan.id,
    status: scan.status,
    score: scan.score,
    createdAt: scan.createdAt,
    createdById: scan.createdById,
    summary: safeJsonObject(scan.summaryJson),
    findings,
    exportedAt: new Date().toISOString(),
  };

  if (format === "md" || format === "markdown") {
    const md = toMarkdown(payload);
    return new NextResponse(md, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="security-scan-${scan.id.slice(0, 8)}.md"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="security-scan-${scan.id.slice(0, 8)}.json"`,
    },
  });
}

function safeJsonObject(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function toMarkdown(payload: {
  scanId: string;
  status: string;
  score: number | null;
  createdAt: Date;
  summary: Record<string, unknown> | null;
  findings: Array<{
    result: string;
    severity: string;
    title: string;
    checkId: string;
    detail: string;
    remediation: string | null;
    status: string;
    skillIds: string[];
  }>;
  exportedAt: string;
}): string {
  const lines: string[] = [
    `# ZEFF Security Scan Report`,
    ``,
    `- Scan ID: \`${payload.scanId}\``,
    `- Status: **${payload.status}**`,
    `- Score: **${payload.score ?? "—"}**`,
    `- Created: ${payload.createdAt.toISOString()}`,
    `- Exported: ${payload.exportedAt}`,
    ``,
    `## Summary`,
    ``,
    "```json",
    JSON.stringify(payload.summary, null, 2),
    "```",
    ``,
    `## Findings`,
    ``,
  ];

  for (const f of payload.findings) {
    lines.push(
      `### [${f.result.toUpperCase()}] ${f.title}`,
      ``,
      `- Severity: \`${f.severity}\``,
      `- Check: \`${f.checkId}\``,
      `- Status: \`${f.status}\``,
      `- Skills: ${f.skillIds.map((s) => `\`${s}\``).join(", ") || "—"}`,
      ``,
      f.detail,
      ``,
    );
    if (f.remediation) {
      lines.push(`**Remediation:** ${f.remediation}`, ``);
    }
  }

  return lines.join("\n");
}
