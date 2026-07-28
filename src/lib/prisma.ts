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
  const adapter = new PrismaPg({
    connectionString: normalizedUrl,
    ssl: { rejectUnauthorized: false },
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
