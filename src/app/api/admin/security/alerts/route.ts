import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "security.alert.config";

export async function GET() {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;
  const row = await prisma.systemConfig.findUnique({ where: { key: KEY } });
  let config = { email: "", threshold: "medium", enabled: false };
  if (row?.value) {
    try {
      config = { ...config, ...JSON.parse(row.value) };
    } catch {
      /* ignore */
    }
  }
  return NextResponse.json(config);
}

export async function PATCH(request: Request) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;
  const body = await request.json().catch(() => ({}));
  const config = {
    email: typeof body.email === "string" ? body.email : "",
    threshold: typeof body.threshold === "string" ? body.threshold : "medium",
    enabled: body.enabled === true,
  };
  await prisma.systemConfig.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(config) },
    update: { value: JSON.stringify(config) },
  });
  return NextResponse.json(config);
}
