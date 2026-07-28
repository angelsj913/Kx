/** Shared Supabase URL rewrite for Node scripts (db push, CLI). */

export const DEFAULT_SUPABASE_REGION = process.env.SUPABASE_REGION?.trim() || "ap-southeast-2";

export function poolerHost(region = DEFAULT_SUPABASE_REGION) {
  return `aws-0-${region}.pooler.supabase.com`;
}

export function extractSupabaseProjectRef(host) {
  const m = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
  return m ? m[1] : null;
}

function appendQueryParams(url, params) {
  for (const [key, value] of Object.entries(params)) {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  }
}

export function normalizeMigrateUrl(url, region = DEFAULT_SUPABASE_REGION) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const ref = extractSupabaseProjectRef(parsed.hostname);
  if (!ref) {
    appendQueryParams(parsed, { sslmode: "require", connect_timeout: "30" });
    return parsed.toString();
  }

  if (parsed.username === "postgres") parsed.username = `postgres.${ref}`;
  parsed.hostname = poolerHost(region);
  parsed.port = "5432";
  appendQueryParams(parsed, { sslmode: "require", connect_timeout: "30" });
  return parsed.toString();
}

export function normalizeRuntimeUrl(url, region = DEFAULT_SUPABASE_REGION) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

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

  if (parsed.username === "postgres") parsed.username = `postgres.${ref}`;
  parsed.hostname = poolerHost(region);
  parsed.port = "6543";
  appendQueryParams(parsed, { pgbouncer: "true", sslmode: "require", connect_timeout: "30" });
  return parsed.toString();
}

export function resolveMigrateDatabaseUrl(raw = process.env.DATABASE_URL) {
  const direct = process.env.DIRECT_URL?.trim();
  if (direct) return normalizeMigrateUrl(direct);
  const url = raw?.trim();
  if (!url) return null;
  return normalizeMigrateUrl(url);
}

export function resolveRuntimeDatabaseUrl(raw = process.env.DATABASE_URL) {
  const url = raw?.trim();
  if (!url) return null;
  return normalizeRuntimeUrl(url);
}

export function maskDatabaseUrl(url) {
  try {
    const u = new URL(url);
    u.password = u.password ? "****" : "";
    return u.toString();
  } catch {
    return "(invalid)";
  }
}
