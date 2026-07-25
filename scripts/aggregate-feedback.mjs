#!/usr/bin/env node
/** 야간 피드백 집계 — UserAiProfile 업데이트 */
import "dotenv/config";

const { PrismaClient } = await import("../src/generated/prisma/client.js");
const { PrismaNeon } = await import("@prisma/adapter-neon");
const { neonConfig, Pool } = await import("@neondatabase/serverless");
const ws = (await import("ws")).default;

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

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
await pool.end();
