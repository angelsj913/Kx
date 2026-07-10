import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// 표준 Postgres 드라이버 어댑터. Supabase든 Neon이든, DATABASE_URL에 그
// 서비스의 연결 문자열(postgresql://...)만 넣으면 동일하게 동작한다 —
// 특정 프로바이더 전용 서버리스 어댑터가 아니라 node-postgres(pg) 기반의
// 범용 어댑터라서 프로바이더를 갈아타도 이 파일은 그대로 두면 된다.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
