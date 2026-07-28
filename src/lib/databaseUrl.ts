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

  const ref = extractSupabaseProjectRef(parsed.hostname);
  if (!ref) {
    appendQueryParams(parsed, { sslmode: "require", connect_timeout: "30" });
    return parsed.toString();
  }

  if (parsed.username === "postgres") {
    parsed.username = `postgres.${ref}`;
  }
  parsed.hostname = poolerHost(region);
  parsed.port = "5432";
  appendQueryParams(parsed, { sslmode: "require", connect_timeout: "30" });
  return parsed.toString();
}

/** Transaction pooler (6543) — serverless runtime (Vercel) */
export function resolveRuntimeDatabaseUrl(
  raw?: string | null,
  region = DEFAULT_REGION,
): string | undefined {
  const url = raw?.trim() || process.env.DATABASE_URL?.trim();
  if (!url) return undefined;

  const parsed = parsePostgresUrl(url);
  if (!parsed) return url;

  const ref = extractSupabaseProjectRef(parsed.hostname);
  if (!ref) {
    if (parsed.hostname.includes("pooler.supabase.com") && parsed.port === "5432") {
      parsed.port = "6543";
      appendQueryParams(parsed, { pgbouncer: "true", sslmode: "require", connect_timeout: "30" });
      return parsed.toString();
    }
    appendQueryParams(parsed, { sslmode: "require", connect_timeout: "30" });
    return parsed.toString();
  }

  if (parsed.username === "postgres") {
    parsed.username = `postgres.${ref}`;
  }
  parsed.hostname = poolerHost(region);
  parsed.port = "6543";
  appendQueryParams(parsed, { pgbouncer: "true", sslmode: "require", connect_timeout: "30" });
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
