import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/requireAdmin";
import { issueOtp } from "@/lib/otp";
import { logAdminAudit } from "@/lib/adminAudit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;
  const email = gate.user.email;
  if (!email) {
    return NextResponse.json({ error: "이메일이 없습니다." }, { status: 400 });
  }
  const result = await issueOtp(email, "admin-access");
  await logAdminAudit({
    adminId: gate.user.id,
    adminEmail: email,
    action: "admin.mfa.send",
  });
  return NextResponse.json({
    ok: true,
    sent: result.sent,
    devCode: result.devCode,
  });
}
