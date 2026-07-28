import assert from "node:assert/strict";
import test from "node:test";

import {
  diagnoseDatabaseUrl,
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

test("rewrites pooler supabase URL with postgres username using project ref env", () => {
  const prev = process.env.SUPABASE_PROJECT_REF;
  process.env.SUPABASE_PROJECT_REF = "ghxqylmopbtazxwyimyg";
  try {
    const out = resolveMigrateDatabaseUrl(
      "postgresql://postgres:secret%40%23@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres",
      "ap-southeast-2",
    );
    assert.ok(out?.includes("postgres.ghxqylmopbtazxwyimyg"));
  } finally {
    if (prev === undefined) delete process.env.SUPABASE_PROJECT_REF;
    else process.env.SUPABASE_PROJECT_REF = prev;
  }
});

test("rewrites direct supabase URL to transaction pooler for runtime", () => {
  const out = resolveRuntimeDatabaseUrl(
    "postgresql://postgres:secret@db.ghxqylmopbtazxwyimyg.supabase.co:5432/postgres",
    "ap-southeast-2",
  );
  assert.ok(out?.includes(":6543"));
  assert.ok(out?.includes("pgbouncer=true"));
});

test("diagnose flags unencoded @ in password", () => {
  const result = diagnoseDatabaseUrl(
    "postgresql://postgres:pass@word@db.ghxqylmopbtazxwyimyg.supabase.co:5432/postgres",
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "unencoded_password");
});

test("diagnose flags pooler URL with postgres username and no ref", () => {
  const prev = process.env.SUPABASE_PROJECT_REF;
  delete process.env.SUPABASE_PROJECT_REF;
  try {
    const result = diagnoseDatabaseUrl(
      "postgresql://postgres:secret@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres",
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "pooler_username");
  } finally {
    if (prev !== undefined) process.env.SUPABASE_PROJECT_REF = prev;
  }
});
