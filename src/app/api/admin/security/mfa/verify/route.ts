import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/requireAdmin";
import { verifyOtp } from "@/lib/otp";
import { setAdminMfaVerified } from "@/lib/adminMfa";
import { logAdminAudit } from "@/lib/adminAudit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;
  const email = gate.user.email;
  if (!email) {
    return NextResponse.json({ error: "이메일이 없습니다." }, { status: 400 });
  }
  const body = await request.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (code.length !== 6) {
    return NextResponse.json({ error: "6자리 코드를 입력하세요." }, { status: 400 });
  }
  const ok = await verifyOtp(email, "admin-access", code);
  if (!ok) {
    return NextResponse.json({ error: "코드가 올바르지 않거나 만료되었습니다." }, { status: 400 });
  }
  await setAdminMfaVerified(gate.user.id);
  await logAdminAudit({
    adminId: gate.user.id,
    adminEmail: email,
    action: "admin.mfa.verified",
  });
  return NextResponse.json({ ok: true });
}
