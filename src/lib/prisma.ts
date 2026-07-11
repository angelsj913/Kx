import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient() {
  // node-postgres 어댑터 — 표준 PostgreSQL(Neon 직접 연결, Google Cloud SQL 등) 모두 호환.
  // SSL 동작은 DATABASE_URL의 sslmode 파라미터로 제어한다(예: ...?sslmode=require).
  // 코드에서 인증서 검증을 끄지 않는다 — TLS 정책은 연결 문자열(사용자 설정)에 맡긴다.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
