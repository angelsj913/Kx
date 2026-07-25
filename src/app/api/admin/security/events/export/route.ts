import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(s: string) {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: Request) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;

  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "all";

  const rows: string[][] = [["kind", "at", "summary", "detail"]];

  if (type === "all" || type === "login") {
    const logins = await prisma.loginEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { user: { select: { email: true } } },
    });
    for (const l of logins) {
      rows.push([
        "login",
        l.createdAt.toISOString(),
        l.user.email ?? l.userId,
        [l.ip, l.provider, l.userAgent].filter(Boolean).join(" | "),
      ]);
    }
  }

  if (type === "all" || type === "audit") {
    const audits = await prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    for (const a of audits) {
      rows.push([
        "audit",
        a.createdAt.toISOString(),
        `${a.action} ${a.adminEmail ?? ""}`,
        a.target ?? "",
      ]);
    }
  }

  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="security-events-${type}.csv"`,
    },
  });
}
