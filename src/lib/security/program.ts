import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CHECK_IDS } from "@/lib/security/checkIds";

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

export function parseEnabledChecks(json: string): string[] {
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export async function syncSkillManifestFromDisk() {
  const path = join(/* turbopackIgnore: true */ process.cwd(), "data", "security-skills.manifest.json");
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

export { DEFAULT_CHECK_IDS };
