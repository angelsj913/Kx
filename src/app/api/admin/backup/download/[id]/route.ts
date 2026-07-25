import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/requireAdmin";
import { buildBackupPayload, encryptBackupJson } from "@/lib/adminBackup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 완료된 백업 재다운로드 — 비밀번호 재입력 필요 (POST) */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 8) {
    return NextResponse.json({ error: "비밀번호 필요" }, { status: 400 });
  }

  const record = await prisma.backupRecord.findUnique({ where: { id } });
  if (!record || record.status !== "completed") {
    return NextResponse.json({ error: "백업을 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    const payload = await buildBackupPayload();
    const encrypted = encryptBackupJson(payload, password);
    return new NextResponse(new Uint8Array(encrypted), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${record.fileName ?? "zeff-backup.enc"}"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
