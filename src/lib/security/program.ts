import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  runSecurityChecks,
  scoreFromOutcomes,
  severityCounts,
  DEFAULT_CHECK_IDS,
  type SecurityCheckOutcome,
} from "@/lib/security/checks";

export async function requireSecurityAdmin() {
  const session = await auth();
  if (!isAdminSession(session) || !session.user?.id) {
    return null;
  }
  const { isAdminMfaVerified } = await import("@/lib/adminMfa");
  if (!(await isAdminMfaVerified(session.user.id))) {
    return null;
  }
  return session;
}

export async function logSecurityEvent(
  type: string,
  actorId: string | null | undefined,
  payload?: unknown,
) {
  await prisma.securityEvent.create({
    data: {
      type,
      actorId: actorId ?? null,
      payload: payload == null ? null : JSON.stringify(payload),
    },
  });
}

export async function getOrCreateSecuritySettings() {
  return prisma.securityProgramSettings.upsert({
    where: { id: "default" },
    create: { id: "default", enabledChecksJson: "[]", notifyOnCritical: true },
    update: {},
  });
}

function parseEnabledChecks(json: string): string[] {
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export async function syncSkillManifestFromDisk() {
  const path = join(process.cwd(), "data/security-skills.manifest.json");
  const raw = await readFile(path, "utf8");
  const data = JSON.parse(raw) as {
    curated?: Array<{
      id: string;
      title: string;
      description: string;
      domain?: string;
      tags?: string[];
      checkIds?: string[];
    }>;
  };
  const curated = data.curated ?? [];
  for (const s of curated) {
    await prisma.securitySkillRef.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        title: s.title,
        description: s.description,
        domain: s.domain ?? null,
        tags: JSON.stringify(s.tags ?? []),
        checkIds: JSON.stringify(s.checkIds ?? []),
      },
      update: {
        title: s.title,
        description: s.description,
        domain: s.domain ?? null,
        tags: JSON.stringify(s.tags ?? []),
        checkIds: JSON.stringify(s.checkIds ?? []),
      },
    });
  }
  return curated.length;
}

export async function runAndPersistScan(createdById: string) {
  const running = await prisma.securityScan.findFirst({
    where: { status: "running" },
    orderBy: { createdAt: "desc" },
  });
  if (running) {
    throw new Error("이미 실행 중인 스캔이 있습니다. 잠시 후 다시 시도해 주세요.");
  }

  const settings = await getOrCreateSecuritySettings();
  const enabled = parseEnabledChecks(settings.enabledChecksJson);

  const scan = await prisma.securityScan.create({
    data: { status: "running", createdById },
  });
  await logSecurityEvent("scan_started", createdById, { scanId: scan.id });

  try {
    const outcomes = await runSecurityChecks(enabled.length ? enabled : null);
    const score = scoreFromOutcomes(outcomes);
    const counts = severityCounts(outcomes);

    // 새 스캔이 기준이 되도록 이전 open Finding은 resolved 처리
    await prisma.securityFinding.updateMany({
      where: { status: "open", scanId: { not: scan.id } },
      data: { status: "resolved" },
    });

    await prisma.securityFinding.createMany({
      data: outcomes.map((o: SecurityCheckOutcome) => ({
        scanId: scan.id,
        checkId: o.checkId,
        skillIds: JSON.stringify(o.skillIds),
        severity: o.severity,
        domain: o.domain ?? null,
        title: o.title,
        detail: o.detail,
        remediation: o.remediation,
        result: o.result,
        status: o.result === "pass" ? "resolved" : "open",
      })),
    });

    const updated = await prisma.securityScan.update({
      where: { id: scan.id },
      data: {
        status: "completed",
        score,
        summaryJson: JSON.stringify({
          counts,
          checkCount: outcomes.length,
          failed: outcomes.filter((o) => o.result === "fail").length,
          warned: outcomes.filter((o) => o.result === "warn").length,
          notifyOnCritical: settings.notifyOnCritical,
        }),
      },
      include: { findings: true },
    });

    await logSecurityEvent("scan_completed", createdById, {
      scanId: scan.id,
      score,
      counts,
    });

    return updated;
  } catch (err) {
    await prisma.securityScan.update({
      where: { id: scan.id },
      data: {
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      },
    });
    await logSecurityEvent("scan_failed", createdById, {
      scanId: scan.id,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export { DEFAULT_CHECK_IDS, parseEnabledChecks };
