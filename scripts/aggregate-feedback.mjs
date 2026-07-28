#!/usr/bin/env node
/** 야간 피드백 집계 — UserAiProfile 업데이트 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { resolveRuntimeDatabaseUrl } from "./supabaseDatabaseUrl.mjs";

const { PrismaClient } = await import("../src/generated/prisma/client.js");

const connectionString = resolveRuntimeDatabaseUrl();
if (!connectionString) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const { aggregateFeedbackForUser } = await import("../src/lib/userLearning.ts");

const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const users = await prisma.answerFeedback.findMany({
  where: { createdAt: { gte: since } },
  select: { userId: true },
  distinct: ["userId"],
});

let ok = 0;
for (const { userId } of users) {
  try {
    await aggregateFeedbackForUser(userId);
    ok++;
  } catch (err) {
    console.warn("[aggregate-feedback] user", userId, err);
  }
}

console.log(`Aggregated profiles for ${ok}/${users.length} users`);
await prisma.$disconnect();
