import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { resolveRuntimeDatabaseUrl } from "@/lib/databaseUrl";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient() {
  const connectionString = resolveRuntimeDatabaseUrl();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  // Strip sslmode from URL — pg parses it in ways that override Pool.ssl and cause
  // "self-signed certificate in certificate chain" on Supabase pooler (Vercel).
  let normalizedUrl = connectionString;
  try {
    const parsed = new URL(connectionString);
    parsed.searchParams.delete("sslmode");
    normalizedUrl = parsed.toString();
  } catch {
    // keep original string
  }
  // Serverless: one connection per isolate. Session pooler exhausted at pool_size=15
  // when many Vercel functions each opened a multi-connection Pool.
  const adapter = new PrismaPg({
    connectionString: normalizedUrl,
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

// Reuse across warm serverless invocations (avoids opening a new Pool each cold path).
globalForPrisma.prisma = prisma;
