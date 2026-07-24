import { NextResponse } from "next/server";
import {
  DEFAULT_CHECK_IDS,
  getOrCreateSecuritySettings,
  logSecurityEvent,
  parseEnabledChecks,
  requireSecurityAdmin,
  syncSkillManifestFromDisk,
} from "@/lib/security/program";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireSecurityAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getOrCreateSecuritySettings();
  return NextResponse.json({
    settings: {
      notifyOnCritical: settings.notifyOnCritical,
      enabledChecks: parseEnabledChecks(settings.enabledChecksJson),
      availableChecks: [...DEFAULT_CHECK_IDS],
      updatedAt: settings.updatedAt,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await requireSecurityAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const data: {
    notifyOnCritical?: boolean;
    enabledChecksJson?: string;
    updatedById: string;
  } = { updatedById: session.user.id };

  if (typeof body?.notifyOnCritical === "boolean") {
    data.notifyOnCritical = body.notifyOnCritical;
  }
  if (Array.isArray(body?.enabledChecks)) {
    const allowed = new Set<string>(DEFAULT_CHECK_IDS);
    const enabled = body.enabledChecks.filter(
      (x: unknown): x is string => typeof x === "string" && allowed.has(x),
    );
    data.enabledChecksJson = JSON.stringify(enabled);
  }

  const { prisma } = await import("@/lib/prisma");
  const settings = await prisma.securityProgramSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      notifyOnCritical: data.notifyOnCritical ?? true,
      enabledChecksJson: data.enabledChecksJson ?? "[]",
      updatedById: session.user.id,
    },
    update: data,
  });

  await logSecurityEvent("settings_updated", session.user.id, {
    notifyOnCritical: settings.notifyOnCritical,
    enabledChecks: parseEnabledChecks(settings.enabledChecksJson),
  });

  return NextResponse.json({
    settings: {
      notifyOnCritical: settings.notifyOnCritical,
      enabledChecks: parseEnabledChecks(settings.enabledChecksJson),
      availableChecks: [...DEFAULT_CHECK_IDS],
      updatedAt: settings.updatedAt,
    },
  });
}

/** 매니페스트 → SecuritySkillRef 동기화 */
export async function POST(request: Request) {
  const session = await requireSecurityAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  if (body?.action !== "sync-skills") {
    return NextResponse.json(
      { error: "action 은 sync-skills 여야 합니다." },
      { status: 400 },
    );
  }

  try {
    const count = await syncSkillManifestFromDisk();
    await logSecurityEvent("skills_synced", session.user.id, { count });
    return NextResponse.json({ ok: true, synced: count });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "동기화 실패" },
      { status: 500 },
    );
  }
}
