#!/usr/bin/env node
/**
 * Vercel build / local: `prisma db push` with Supabase-friendly URL rewrite.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import {
  diagnoseDatabaseUrl,
  maskDatabaseUrl,
  resolveMigrateDatabaseUrl,
} from "./supabaseDatabaseUrl.mjs";

const MAX_ATTEMPTS = 4;
const DELAYS_MS = [5000, 10000, 20000];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadProjectEnv() {
  const root = process.cwd();
  const envPath = resolve(root, ".env");
  const envLocalPath = resolve(root, ".env.local");
  if (existsSync(envPath)) loadEnv({ path: envPath });
  if (existsSync(envLocalPath)) loadEnv({ path: envLocalPath, override: true });
}

function isPlaceholderDatabaseUrl(url) {
  if (!url) return true;
  try {
    const u = new URL(url);
    return (
      u.hostname === "localhost" &&
      u.port === "5432" &&
      (u.pathname === "/x" || u.pathname === "/postgres") &&
      (u.username === "x" || u.username === "postgres")
    );
  } catch {
    return false;
  }
}

function shouldSkipDbPush() {
  if (process.env.SKIP_DB_PUSH === "1" || process.env.SKIP_DB_PUSH === "true") {
    return { skip: true, reason: "SKIP_DB_PUSH" };
  }
  const url = process.env.DATABASE_URL?.trim();
  if (!url && !process.env.DIRECT_URL?.trim()) {
    return { skip: true, reason: "missing_DATABASE_URL" };
  }
  if (url && isPlaceholderDatabaseUrl(url)) {
    return { skip: true, reason: "placeholder_DATABASE_URL" };
  }
  return { skip: false, reason: null };
}

async function main() {
  loadProjectEnv();
  const skip = shouldSkipDbPush();

  if (skip.skip) {
    console.log(`[db-push-retry] skipping prisma db push (${skip.reason})`);
    process.exit(0);
  }

  const rawUrl = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
  const diagnosis = diagnoseDatabaseUrl(rawUrl);
  if (!diagnosis.ok) {
    console.error(`[db-push-retry] ${diagnosis.message}`);
    process.exit(1);
  }

  const migrateUrl = resolveMigrateDatabaseUrl();
  if (!migrateUrl) {
    console.error("[db-push-retry] no migrate URL after resolve");
    process.exit(1);
  }

  console.log(`[db-push-retry] migrate target: ${maskDatabaseUrl(migrateUrl)}`);

  const env = { ...process.env, DATABASE_URL: migrateUrl };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[db-push-retry] prisma db push (attempt ${attempt}/${MAX_ATTEMPTS})`);
    const result = spawnSync("npx", ["prisma", "db", "push", "--accept-data-loss"], {
      stdio: "inherit",
      shell: process.platform === "win32",
      env,
    });

    if (result.status === 0) {
      process.exit(0);
    }

    if (attempt < MAX_ATTEMPTS) {
      const delay = DELAYS_MS[attempt - 1] ?? DELAYS_MS[DELAYS_MS.length - 1];
      console.warn(
        `[db-push-retry] failed (exit ${result.status}), retrying in ${delay / 1000}s...`,
      );
      await sleep(delay);
    }
  }

  console.error(`[db-push-retry] failed after ${MAX_ATTEMPTS} attempts`);
  process.exit(1);
}

main();
