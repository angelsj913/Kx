/** Shared Supabase URL rewrite for Node scripts (db push, CLI). */

export const DEFAULT_SUPABASE_REGION = process.env.SUPABASE_REGION?.trim() || "ap-southeast-2";

export function poolerHost(region = DEFAULT_SUPABASE_REGION) {
  return `aws-0-${region}.pooler.supabase.com`;
}

export function extractSupabaseProjectRef(host) {
  const m = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
  return m ? m[1] : null;
}

export function extractSupabaseProjectRefFromUsername(username) {
  const m = username.match(/^postgres\.([a-z0-9]+)$/i);
  return m ? m[1] : null;
}

/** Resolve project ref from host, username, env, or sibling connection strings. */
export function resolveSupabaseProjectRef(parsed, env = process.env) {
  const fromHost = extractSupabaseProjectRef(parsed.hostname);
  if (fromHost) return fromHost;

  const fromUsername = extractSupabaseProjectRefFromUsername(parsed.username);
  if (fromUsername) return fromUsername;

  const envRef = env.SUPABASE_PROJECT_REF?.trim();
  if (envRef) return envRef;

  for (const key of ["DIRECT_URL", "DATABASE_URL"]) {
    const raw = env[key]?.trim();
    if (!raw) continue;
    const fromDirectHost = raw.match(/db\.([a-z0-9]+)\.supabase\.co/i);
    if (fromDirectHost) return fromDirectHost[1];
    const fromPoolerUser = raw.match(/postgres\.([a-z0-9]+)@/i);
    if (fromPoolerUser) return fromPoolerUser[1];
  }

  for (const key of ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]) {
    const raw = env[key]?.trim();
    if (!raw) continue;
    const fromProjectUrl = raw.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i);
    if (fromProjectUrl) return fromProjectUrl[1];
  }

  return null;
}

function isSupabasePoolerHost(hostname) {
  return hostname.includes(".pooler.supabase.com");
}

function ensurePoolerUsername(parsed, ref) {
  if (!ref) return;
  if (parsed.username === "postgres") parsed.username = `postgres.${ref}`;
}

function isPlaceholderPassword(password) {
  if (!password) return true;
  const p = password.trim();
  if (!p) return true;
  return /^(?:\[)?YOUR[-_]?PASSWORD(?:\])?$/i.test(p) || /^<password>$/i.test(p) || p === "changeme";
}

function hasUnencodedHashInUserinfo(raw) {
  const trimmed = raw.trim();
  const schemeIdx = trimmed.indexOf("://");
  if (schemeIdx === -1) return false;
  const atIdx = trimmed.indexOf("@", schemeIdx + 3);
  if (atIdx === -1) return false;
  const userinfo = trimmed.slice(schemeIdx + 3, atIdx);
  return userinfo.includes("#");
}

/** Detect common URL mistakes (unencoded @/# in password breaks parsing). */
export function diagnoseDatabaseUrl(raw) {
  if (!raw?.trim()) return { ok: false, code: "missing", message: "DATABASE_URL is not set" };

  const trimmed = raw.trim();

  if (hasUnencodedHashInUserinfo(trimmed)) {
    return {
      ok: false,
      code: "unencoded_password_hash",
      message:
        "DATABASE_URL contains an unencoded # in the password (# starts a URL fragment and truncates the password). Encode # as %23.",
    };
  }

  let parsed;
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
    extractSupabaseProjectRef(host) || isSupabasePoolerHost(host) || host.includes("supabase.co");
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

export const P1000_HELP = `Supabase rejected the database password (Prisma P1000).
The pooler host and username look correct — update DATABASE_URL in Vercel:
  1. Supabase Dashboard → Project Settings → Database → Reset database password
  2. Encode the password: node -e "console.log(encodeURIComponent('YOUR_NEW_PASSWORD'))"
  3. Set DATABASE_URL (direct URI is fine; build rewrites to pooler):
     postgresql://postgres:ENCODED_PASSWORD@db.ghxqylmopbtazxwyimyg.supabase.co:5432/postgres
  4. Use the DATABASE password — not anon/service_role API keys
  5. Redeploy (or run: npm run db:encode-url locally to build the URI)
Emergency: set SKIP_DB_PUSH=1 in Vercel to deploy the app without schema push.`;

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

export function normalizeRuntimeUrl(url, region = DEFAULT_SUPABASE_REGION) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const ref = resolveSupabaseProjectRef(parsed);
  ensurePoolerUsername(parsed, ref);

  const directHost = extractSupabaseProjectRef(parsed.hostname);
  if (!directHost) {
    if (isSupabasePoolerHost(parsed.hostname) && parsed.port === "5432") {
      parsed.port = "6543";
      appendQueryParams(parsed, { pgbouncer: "true", sslmode: "require", connect_timeout: "30" });
      return parsed.toString();
    }
    appendQueryParams(parsed, { sslmode: "require", connect_timeout: "30" });
    return parsed.toString();
  }

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
