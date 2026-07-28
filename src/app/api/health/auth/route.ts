import { NextResponse } from "next/server";
import { getAuthEnvStatus } from "@/lib/authEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Deployment smoke test — booleans only, no secret values. */
export async function GET() {
  const status = getAuthEnvStatus();
  return NextResponse.json(status, { status: status.ok ? 200 : 503 });
}
