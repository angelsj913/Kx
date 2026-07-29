import { prisma } from "@/lib/prisma";
import {
  scoreFromOutcomes,
  severityCounts,
  type SecurityCheckOutcome,
} from "@/lib/security/checkIds";
import {
  getOrCreateSecuritySettings,
  logSecurityEvent,
  parseEnabledChecks,
} from "@/lib/security/program";

/** Filesystem-heavy security scan — isolated so other API routes avoid Turbopack NFT warnings. */
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
    // Relative path required: turbopackIgnore bypasses Next alias resolution, so
    // `@/lib/...` is treated as an npm package and fails with
    // "Cannot find package '@/lib'" on Vercel.
    const { runSecurityChecks } = await import(
      /* turbopackIgnore: true */ "./checks"
    );
    const outcomes = await runSecurityChecks(enabled.length ? enabled : null);
    const score = scoreFromOutcomes(outcomes);
    const counts = severityCounts(outcomes);

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
