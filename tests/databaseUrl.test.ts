import assert from "node:assert/strict";
import test from "node:test";

import {
  extractSupabaseProjectRef,
  resolveMigrateDatabaseUrl,
  resolveRuntimeDatabaseUrl,
} from "../src/lib/databaseUrl";

test("extracts supabase project ref from direct host", () => {
  assert.equal(extractSupabaseProjectRef("db.ghxqylmopbtazxwyimyg.supabase.co"), "ghxqylmopbtazxwyimyg");
});

test("rewrites direct supabase URL to session pooler for migrate", () => {
  const out = resolveMigrateDatabaseUrl(
    "postgresql://postgres:secret%40%23@db.ghxqylmopbtazxwyimyg.supabase.co:5432/postgres",
    "ap-southeast-2",
  );
  assert.ok(out?.includes("aws-0-ap-southeast-2.pooler.supabase.com:5432"));
  assert.ok(out?.includes("postgres.ghxqylmopbtazxwyimyg"));
  assert.ok(out?.includes("sslmode=require"));
});

test("rewrites direct supabase URL to transaction pooler for runtime", () => {
  const out = resolveRuntimeDatabaseUrl(
    "postgresql://postgres:secret@db.ghxqylmopbtazxwyimyg.supabase.co:5432/postgres",
    "ap-southeast-2",
  );
  assert.ok(out?.includes(":6543"));
  assert.ok(out?.includes("pgbouncer=true"));
});
