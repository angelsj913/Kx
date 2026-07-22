import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

const COOKIE = "zeff_admin_mfa";
const TTL_MS = 8 * 60 * 60 * 1000;

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function adminMfaSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-admin-mfa";
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
    path: "/admin",
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
  if (sig !== expected) return false;
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
