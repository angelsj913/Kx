import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

const COOKIE = "zeff_admin_mfa";
/** NextAuth session maxAge(30일)와 동일 — 보안 페이지는 세션당 1회 MFA */
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function adminMfaSecret() {
  const secret =
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET (또는 NEXTAUTH_SECRET)이 필요합니다.");
  }
  return "dev-admin-mfa";
}

export async function setAdminMfaVerified(userId: string) {
  const exp = Date.now() + TTL_MS;
  const payload = `${userId}:${exp}`;
  const sig = sign(payload, adminMfaSecret());
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sig}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // /api/admin/** 도 쿠키를 보내야 API MFA 게이트가 동작한다
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}

export async function isAdminMfaVerified(userId: string): Promise<boolean> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return false;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload, adminMfaSecret());
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  const [uid, expStr] = payload.split(":");
  if (uid !== userId) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  return true;
}

export async function requireAdminMfa(userId: string) {
  const ok = await isAdminMfaVerified(userId);
  if (!ok) redirect("/admin/verify");
}
