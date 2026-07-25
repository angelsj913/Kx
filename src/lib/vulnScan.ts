import { execFile } from "child_process";
import { promisify } from "util";
import { prisma } from "@/lib/prisma";

const execFileAsync = promisify(execFile);

export type AuditFinding = {
  name: string;
  severity: string;
  title: string;
  url?: string;
};

export async function runOssAudit(): Promise<{ findings: AuditFinding[]; summary: Record<string, number> }> {
  try {
    const { stdout } = await execFileAsync("npm", ["audit", "--json"], {
      cwd: process.cwd(),
      timeout: 120_000,
      maxBuffer: 4 * 1024 * 1024,
    });
    return parseAuditJson(stdout);
  } catch (err: unknown) {
    const e = err as { stdout?: string; message?: string };
    if (e.stdout) return parseAuditJson(e.stdout);
    throw new Error(e.message ?? "npm audit failed");
  }
}

function parseAuditJson(stdout: string) {
  const data = JSON.parse(stdout) as {
    vulnerabilities?: Record<string, { name: string; severity: string; via?: unknown[] }>;
    metadata?: { vulnerabilities?: Record<string, number> };
  };
  const findings: AuditFinding[] = [];
  for (const v of Object.values(data.vulnerabilities ?? {})) {
    findings.push({ name: v.name, severity: v.severity, title: v.name });
  }
  return {
    findings: findings.sort((a, b) => severityRank(b.severity) - severityRank(a.severity)),
    summary: data.metadata?.vulnerabilities ?? {},
  };
}

function severityRank(s: string) {
  const order: Record<string, number> = { critical: 4, high: 3, moderate: 2, low: 1, info: 0 };
  return order[s] ?? 0;
}

export async function createOssScan(adminEmail?: string | null) {
  const row = await prisma.vulnerabilityScan.create({
    data: { status: "running", trigger: "oss", adminEmail: adminEmail ?? null },
  });
  try {
    const result = await runOssAudit();
    await prisma.vulnerabilityScan.update({
      where: { id: row.id },
      data: {
        status: "completed",
        reportJson: result,
        completedAt: new Date(),
        fileName: "package-lock.json",
      },
    });
    return { id: row.id, ...result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.vulnerabilityScan.update({
      where: { id: row.id },
      data: { status: "failed", error: message, completedAt: new Date() },
    });
    throw err;
  }
}
