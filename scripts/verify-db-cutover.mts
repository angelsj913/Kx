import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[verify-db-cutover] FAIL missing DATABASE_URL");
  process.exit(1);
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function countOrThrow<T>(name: string, run: () => Promise<T>) {
  try {
    const value = await run();
    console.log(`[verify-db-cutover] ${name}:`, value);
    return value;
  } catch (err) {
    console.error(`[verify-db-cutover] ${name} failed`, err);
    throw err;
  }
}

async function main() {
  await prisma.$queryRaw`SELECT 1`;

  await countOrThrow("users", () => prisma.user.count());
  await countOrThrow("accounts", () => prisma.account.count());
  await countOrThrow("sessions", () => prisma.session.count());
  await countOrThrow("loginEvents", () => prisma.loginEvent.count());
  await countOrThrow("userSettings", () => prisma.userSettings.count());
  await countOrThrow("orders", () => prisma.order.count());
  await countOrThrow("workspaces", () => prisma.workspace.count());
  await countOrThrow("workspaceMembers", () => prisma.workspaceMember.count());
  await countOrThrow("usageCounters", () => prisma.usageCounter.count());
  await countOrThrow("chatSessions", () => prisma.chatSession.count());
  await countOrThrow("chatHistory", () => prisma.chatHistory.count());
  await countOrThrow("libraryItems", () => prisma.libraryItem.count());

  console.log("[verify-db-cutover] OK");
}

main()
  .catch((err) => {
    if (err && typeof err === "object" && "code" in err && err.code === "ECONNREFUSED") {
      console.error("[verify-db-cutover] FAIL database refused the connection");
    }
    console.error("[verify-db-cutover] FAIL", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
