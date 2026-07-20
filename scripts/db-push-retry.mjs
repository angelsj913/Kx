#!/usr/bin/env node
/**
 * Vercel 빌드 중 `prisma db push`가 Neon 컴퓨트의 슬립 해제 지연 등으로
 * 간헐적으로 P1001(접속 불가)을 내는 경우가 있어, 짧은 대기 후 재시도한다.
 *
 * 로컬 placeholder DATABASE_URL 또는 SKIP_DB_PUSH=1 이면 push 를 건너뛴다
 * (Next.js 빌드만 통과시키기 위함. Vercel/운영은 실제 Neon URL 사용).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

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

/** 로컬 placeholder — postgres 없이 tsc/build 만 확인할 때 */
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
  if (!url) return { skip: true, reason: "missing_DATABASE_URL" };
  if (isPlaceholderDatabaseUrl(url)) return { skip: true, reason: "placeholder_DATABASE_URL" };
  return { skip: false, reason: null };
}

async function main() {
  loadProjectEnv();
  const skip = shouldSkipDbPush();

  if (skip.skip) {
    console.log(`[db-push-retry] skipping prisma db push (${skip.reason})`);
    process.exit(0);
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[db-push-retry] prisma db push (attempt ${attempt}/${MAX_ATTEMPTS})`);
    const result = spawnSync("npx", ["prisma", "db", "push", "--accept-data-loss"], {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
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

  console.error(`[db-push-retry] prisma db push failed after ${MAX_ATTEMPTS} attempts`);
  process.exit(1);
}

main();
