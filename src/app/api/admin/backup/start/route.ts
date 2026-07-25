import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/requireAdmin";
import { logAdminAudit } from "@/lib/adminAudit";
import {
  backupFileName,
  buildBackupPayload,
  encryptBackupJson,
} from "@/lib/adminBackup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;
  const session = gate;

  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  const trigger = body.trigger === "scheduled" ? "scheduled" : "manual";

  if (password.length < 8) {
    return NextResponse.json({ error: "백업 비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
  }

  const fileName = backupFileName();
  const record = await prisma.backupRecord.create({
    data: {
      status: "running",
      trigger,
      fileName,
      adminEmail: session.user.email ?? null,
    },
  });

  try {
    const payload = await buildBackupPayload();
    const encrypted = encryptBackupJson(payload, password);
    const encryptedBase64 = encrypted.toString("base64");

    await prisma.backupRecord.update({
      where: { id: record.id },
      data: {
        status: "completed",
        sizeBytes: BigInt(encrypted.length),
        completedAt: new Date(),
      },
    });

    await logAdminAudit({
      adminId: session.user.id,
      adminEmail: session.user.email,
      action: "backup.completed",
      target: record.id,
      meta: { trigger, fileName, sizeBytes: encrypted.length },
    });

    return NextResponse.json({
      ok: true,
      recordId: record.id,
      fileName,
      encryptedBase64,
      downloadUrl: `/api/admin/backup/download/${record.id}?token=${record.id}`,
      sizeBytes: encrypted.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.backupRecord.update({
      where: { id: record.id },
      data: { status: "failed", error: message, completedAt: new Date() },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
