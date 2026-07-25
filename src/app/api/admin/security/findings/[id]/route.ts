import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent, requireSecurityAdmin, parseEnabledChecks } from "@/lib/security/program";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set(["open", "acknowledged", "resolved", "waived"]);

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await requireSecurityAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const status = String(body?.status ?? "");
  const waiveReason =
    typeof body?.waiveReason === "string" ? body.waiveReason.trim() : "";

  if (!STATUSES.has(status)) {
    return NextResponse.json(
      { error: "status는 open|acknowledged|resolved|waived 여야 합니다." },
      { status: 400 },
    );
  }
  if (status === "waived" && !waiveReason) {
    return NextResponse.json(
      { error: "waived 로 변경할 때는 waiveReason이 필요합니다." },
      { status: 400 },
    );
  }

  const existing = await prisma.securityFinding.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Finding을 찾을 수 없습니다." }, { status: 404 });
  }

  const finding = await prisma.securityFinding.update({
    where: { id },
    data: {
      status,
      waiveReason: status === "waived" ? waiveReason : null,
    },
  });

  await logSecurityEvent("finding_updated", session.user.id, {
    findingId: id,
    from: existing.status,
    to: status,
    waiveReason: status === "waived" ? waiveReason : undefined,
  });

  return NextResponse.json({
    finding: {
      ...finding,
      skillIds: parseEnabledChecks(finding.skillIds),
    },
  });
}
