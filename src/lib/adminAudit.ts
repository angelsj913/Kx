import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type AuditInput = {
  adminId?: string | null;
  adminEmail?: string | null;
  action: string;
  target?: string | null;
  meta?: Prisma.InputJsonValue | null;
  ip?: string | null;
};

export async function logAdminAudit(input: AuditInput) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: input.adminId ?? null,
        adminEmail: input.adminEmail ?? null,
        action: input.action,
        target: input.target ?? null,
        meta: input.meta ?? undefined,
        ip: input.ip ?? null,
      },
    });
  } catch (err) {
    console.error("[adminAudit]", err);
  }
}
