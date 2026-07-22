import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/requireAdmin";
import { logAdminAudit } from "@/lib/adminAudit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = new Set(["superadmin", "security", "support", "readonly"]);

export async function GET() {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;
  const rows = await prisma.adminRoleAssignment.findMany();
  return NextResponse.json({ assignments: rows });
}

export async function POST(request: Request) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;
  const body = await request.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId : "";
  const role = typeof body.role === "string" ? body.role : "";
  if (!userId || !ROLES.has(role)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const row = await prisma.adminRoleAssignment.upsert({
    where: { userId },
    create: { userId, role },
    update: { role },
  });
  await logAdminAudit({
    adminId: gate.user.id,
    adminEmail: gate.user.email,
    action: "rbac.update",
    target: userId,
    meta: { role },
  });
  return NextResponse.json(row);
}
