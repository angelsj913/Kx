/** Non-secret auth env checklist for deployment debugging. */
export function getAuthEnvStatus() {
  const authSecret = Boolean(
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim(),
  );
  const googleOAuth = Boolean(
    process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim(),
  );
  const databaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  const authUrl = Boolean(
    process.env.AUTH_URL?.trim() ||
      process.env.NEXTAUTH_URL?.trim() ||
      process.env.VERCEL_URL,
  );

  const issues: string[] = [];
  if (!authSecret) {
    issues.push("AUTH_SECRET (or NEXTAUTH_SECRET) is missing — login will fail with Configuration error");
  }
  if (!googleOAuth) {
    issues.push("AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET missing — Google login disabled");
  }
  if (!databaseUrl) {
    issues.push("DATABASE_URL is missing — user/session persistence will fail");
  }
  if (!authUrl) {
    issues.push("AUTH_URL / NEXTAUTH_URL / VERCEL_URL missing — set AUTH_URL to your public site URL");
  }

  return {
    ok: authSecret && databaseUrl,
    authSecret,
    googleOAuth,
    databaseUrl,
    authUrl,
    issues,
  };
}
