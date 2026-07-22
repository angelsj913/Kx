import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SCHEDULE_HOURS = 48;

export async function GET() {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;

  const records = await prisma.backupRecord.findMany({
    orderBy: { startedAt: "desc" },
    take: 30,
  });

  const lastCompleted = records.find((r) => r.status === "completed");
  let nextScheduledAt: string | null = null;
  if (lastCompleted?.completedAt) {
    nextScheduledAt = new Date(
      new Date(lastCompleted.completedAt).getTime() + SCHEDULE_HOURS * 60 * 60 * 1000,
    ).toISOString();
  }

  return NextResponse.json({
    records: records.map((r) => ({
      ...r,
      sizeBytes: r.sizeBytes?.toString() ?? null,
    })),
    nextScheduledAt,
    scheduleIntervalHours: SCHEDULE_HOURS,
  });
}
