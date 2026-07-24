import { NextResponse } from "next/server";
import { assertRateLimit, RateLimitError } from "@/lib/rateLimit";
import { requireSecurityAdmin, runAndPersistScan } from "@/lib/security/program";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await requireSecurityAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await assertRateLimit("security-scan:admin", session.user.id, {
      max: 10,
      windowSeconds: 3600,
    });
    const scan = await runAndPersistScan(session.user.id);
    return NextResponse.json({
      ok: true,
      scan: {
        id: scan.id,
        status: scan.status,
        score: scan.score,
        createdAt: scan.createdAt,
        summaryJson: scan.summaryJson,
        findings: scan.findings.map((f) => ({
          ...f,
          skillIds: JSON.parse(f.skillIds || "[]"),
        })),
      },
    });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    const message = err instanceof Error ? err.message : "스캔에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
