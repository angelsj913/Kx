/**
 * Supabase Postgres connection URL helpers.
 *
 * Direct host `db.<ref>.supabase.co` is IPv6-heavy and often unreachable from
 * Vercel build workers / IPv4-only networks (Prisma P1001). Pooler hosts work.
 */

const DEFAULT_REGION = process.env.SUPABASE_REGION?.trim() || "ap-southeast-2";

function appendQueryParams(url: URL, params: Record<string, string>) {
  for (const [key, value] of Object.entries(params)) {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  }
}

export function extractSupabaseProjectRef(host: string): string | null {
  const direct = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
  if (direct) return direct[1] ?? null;
  return null;
}

export function extractSupabaseProjectRefFromUsername(username: string): string | null {
  const m = username.match(/^postgres\.([a-z0-9]+)$/i);
  return m ? (m[1] ?? null) : null;
}

export function resolveSupabaseProjectRef(
  parsed: URL,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const fromHost = extractSupabaseProjectRef(parsed.hostname);
  if (fromHost) return fromHost;

  const fromUsername = extractSupabaseProjectRefFromUsername(parsed.username);
  if (fromUsername) return fromUsername;

  const envRef = env.SUPABASE_PROJECT_REF?.trim();
  if (envRef) return envRef;

  for (const key of ["DIRECT_URL", "DATABASE_URL"] as const) {
    const raw = env[key]?.trim();
    if (!raw) continue;
    const fromDirectHost = raw.match(/db\.([a-z0-9]+)\.supabase\.co/i);
    if (fromDirectHost) return fromDirectHost[1] ?? null;
    const fromPoolerUser = raw.match(/postgres\.([a-z0-9]+)@/i);
    if (fromPoolerUser) return fromPoolerUser[1] ?? null;
  }

  for (const key of ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"] as const) {
    const raw = env[key]?.trim();
    if (!raw) continue;
    const fromProjectUrl = raw.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i);
    if (fromProjectUrl) return fromProjectUrl[1] ?? null;
  }

  return null;
}

function isSupabasePoolerHost(hostname: string): boolean {
  return hostname.includes(".pooler.supabase.com");
}

function ensurePoolerUsername(parsed: URL, ref: string | null): void {
  if (!ref) return;
  if (parsed.username === "postgres") {
    parsed.username = `postgres.${ref}`;
  }
}

function isPlaceholderPassword(password: string): boolean {
  if (!password) return true;
  const p = password.trim();
  if (!p) return true;
  return /^(?:\[)?YOUR[-_]?PASSWORD(?:\])?$/i.test(p) || /^<password>$/i.test(p) || p === "changeme";
}

function hasUnencodedHashInUserinfo(raw: string): boolean {
  const trimmed = raw.trim();
  const schemeIdx = trimmed.indexOf("://");
  if (schemeIdx === -1) return false;
  const atIdx = trimmed.indexOf("@", schemeIdx + 3);
  if (atIdx === -1) return false;
  const userinfo = trimmed.slice(schemeIdx + 3, atIdx);
  return userinfo.includes("#");
}

export type DatabaseUrlDiagnosis =
  | { ok: true; ref: string | null; username: string; host: string }
  | { ok: false; code: string; message: string };

export function diagnoseDatabaseUrl(raw?: string | null): DatabaseUrlDiagnosis {
  if (!raw?.trim()) {
    return { ok: false, code: "missing", message: "DATABASE_URL is not set" };
  }

  const trimmed = raw.trim();

  if (hasUnencodedHashInUserinfo(trimmed)) {
    return {
      ok: false,
      code: "unencoded_password_hash",
      message:
        "DATABASE_URL contains an unencoded # in the password (# starts a URL fragment and truncates the password). Encode # as %23.",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      ok: false,
      code: "invalid_url",
      message:
        "DATABASE_URL is not a valid URL. If the password contains @ or #, URL-encode it first (@ → %40, # → %23).",
    };
  }

  const host = parsed.hostname;
  const isSupabase =
    extractSupabaseProjectRef(host) !== null ||
    isSupabasePoolerHost(host) ||
    host.includes("supabase.co");
  if (!isSupabase) {
    return {
      ok: false,
      code: "unexpected_host",
      message: `DATABASE_URL host looks wrong (${host}). Expected db.<ref>.supabase.co or *.pooler.supabase.com`,
    };
  }

  const afterScheme = trimmed.replace(/^postgresql:\/\//i, "");
  const atCount = (afterScheme.match(/@/g) || []).length;
  if (atCount > 1) {
    return {
      ok: false,
      code: "unencoded_password",
      message:
        "DATABASE_URL appears to contain an unencoded @ in the password. Encode special characters (@ → %40, # → %23).",
    };
  }

  if (isPlaceholderPassword(parsed.password)) {
    return {
      ok: false,
      code: "placeholder_password",
      message:
        "DATABASE_URL still contains a placeholder password (e.g. YOUR-PASSWORD). Set the real Supabase database password from Dashboard → Database → Database password.",
    };
  }

  const ref = resolveSupabaseProjectRef(parsed);
  if (isSupabasePoolerHost(host) && parsed.username === "postgres" && !ref) {
    return {
      ok: false,
      code: "pooler_username",
      message:
        "Supabase pooler requires username postgres.<project-ref>, not postgres. Use a direct URI (db.<ref>.supabase.co), set SUPABASE_PROJECT_REF, or paste the pooler URI from Supabase Connect.",
    };
  }

  return { ok: true, ref, username: parsed.username, host };
}

function parsePostgresUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function poolerHost(region: string): string {
  return `aws-0-${region}.pooler.supabase.com`;
}

/** Session pooler (5432) — prisma db push / migrations */
export function resolveMigrateDatabaseUrl(
  raw?: string | null,
  region = DEFAULT_REGION,
): string | undefined {
  const directUrl = process.env.DIRECT_URL?.trim();
  if (directUrl) return normalizeMigrateUrl(directUrl, region);

  const url = raw?.trim() || process.env.DATABASE_URL?.trim();
  if (!url) return undefined;
  return normalizeMigrateUrl(url, region);
}

function normalizeMigrateUrl(url: string, region: string): string {
  const parsed = parsePostgresUrl(url);
  if (!parsed) return url;

  const ref = resolveSupabaseProjectRef(parsed);
  ensurePoolerUsername(parsed, ref);

  if (!extractSupabaseProjectRef(parsed.hostname)) {
    appendQueryParams(parsed, { sslmode: "require", connect_timeout: "30" });
    return parsed.toString();
  }

  parsed.hostname = poolerHost(region);
  parsed.port = "5432";
  appendQueryParams(parsed, { sslmode: "require", connect_timeout: "30" });
  return parsed.toString();
}

/** Transaction pooler (6543) — serverless runtime (Vercel). */
export function resolveRuntimeDatabaseUrl(
  raw?: string | null,
  region = DEFAULT_REGION,
): string | undefined {
  const url = raw?.trim() || process.env.DATABASE_URL?.trim();
  if (!url) return undefined;

  const parsed = parsePostgresUrl(url);
  if (!parsed) return url;

  const ref = resolveSupabaseProjectRef(parsed);
  ensurePoolerUsername(parsed, ref);

  const directHost = extractSupabaseProjectRef(parsed.hostname);
  if (!directHost) {
    if (isSupabasePoolerHost(parsed.hostname)) {
      // Transaction mode scales for serverless; session mode (5432) hits pool_size caps.
      parsed.port = "6543";
      appendQueryParams(parsed, {
        pgbouncer: "true",
        sslmode: "require",
        connect_timeout: "30",
      });
      return parsed.toString();
    }
    appendQueryParams(parsed, { sslmode: "require", connect_timeout: "30" });
    return parsed.toString();
  }

  parsed.hostname = poolerHost(region);
  parsed.port = "6543";
  appendQueryParams(parsed, {
    pgbouncer: "true",
    sslmode: "require",
    connect_timeout: "30",
  });
  return parsed.toString();
}

export function maskDatabaseUrl(raw?: string | null): string {
  if (!raw) return "(unset)";
  try {
    const u = new URL(raw);
    u.password = u.password ? "****" : "";
    return u.toString();
  } catch {
    return "(invalid url)";
  }
}
