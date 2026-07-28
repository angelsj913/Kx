#!/usr/bin/env node
/** Smoke-test DB connectivity after Supabase cutover. */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { maskDatabaseUrl, resolveRuntimeDatabaseUrl } from "./supabaseDatabaseUrl.mjs";

const connectionString = resolveRuntimeDatabaseUrl();
if (!connectionString) {
  console.error("[verify-db] FAIL missing DATABASE_URL");
  process.exit(1);
}

console.log("[verify-db] target:", maskDatabaseUrl(connectionString));

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function countOrThrow(name, run) {
  try {
    const n = await run();
    console.log(`[verify-db] OK ${name}: ${n}`);
    return n;
  } catch (err) {
    console.error(`[verify-db] FAIL ${name}`, err);
    throw err;
  }
}

try {
  await prisma.$queryRaw`SELECT 1`;
  await countOrThrow("User", () => prisma.user.count());
  await countOrThrow("ChatSession", () => prisma.chatSession.count());
  await countOrThrow("LibraryItem", () => prisma.libraryItem.count());
  console.log("[verify-db] OK");
} catch (err) {
  if (err && typeof err === "object" && "code" in err && err.code === "ECONNREFUSED") {
    console.error("[verify-db] FAIL database refused the connection");
  }
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
