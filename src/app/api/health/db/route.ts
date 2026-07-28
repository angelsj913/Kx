import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { maskDatabaseUrl, resolveRuntimeDatabaseUrl } from "@/lib/databaseUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Runtime DB smoke test — no secrets, safe for production. */
export async function GET() {
  const runtimeUrl = resolveRuntimeDatabaseUrl();
  if (!runtimeUrl) {
    return NextResponse.json(
      { ok: false, code: "missing_database_url", message: "DATABASE_URL is not set" },
      { status: 503 },
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();
    return NextResponse.json({
      ok: true,
      userCount,
      runtimeHost: (() => {
        try {
          return new URL(runtimeUrl).host;
        } catch {
          return "(invalid)";
        }
      })(),
      databaseUrl: maskDatabaseUrl(process.env.DATABASE_URL),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[health/db]", err);
    return NextResponse.json(
      {
        ok: false,
        code: "db_query_failed",
        message,
        runtimeHost: (() => {
          try {
            return new URL(runtimeUrl).host;
          } catch {
            return "(invalid)";
          }
        })(),
      },
      { status: 503 },
    );
  }
}
