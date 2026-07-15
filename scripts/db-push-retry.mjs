#!/usr/bin/env node
/**
 * Vercel 빌드 중 `prisma db push`가 Neon 컴퓨트의 슬립 해제 지연 등으로
 * 간헐적으로 P1001(접속 불가)을 내는 경우가 있어, 짧은 대기 후 재시도한다.
 */
import { spawnSync } from "node:child_process";

const MAX_ATTEMPTS = 4;
const DELAYS_MS = [5000, 10000, 20000];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[db-push-retry] prisma db push (attempt ${attempt}/${MAX_ATTEMPTS})`);
    const result = spawnSync("npx", ["prisma", "db", "push"], {
      stdio: "inherit",
      shell: process.platform === "win32",
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
