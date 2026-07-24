import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSecurityAdmin, syncSkillManifestFromDisk, parseEnabledChecks } from "@/lib/security/program";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireSecurityAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const tag = (url.searchParams.get("tag") || "").trim().toLowerCase();
  const domain = (url.searchParams.get("domain") || "").trim().toLowerCase();

  let skills = await prisma.securitySkillRef.findMany({
    orderBy: { title: "asc" },
  });

  // DB가 비어 있으면 매니페스트를 한 번 동기화
  if (skills.length === 0) {
    try {
      await syncSkillManifestFromDisk();
      skills = await prisma.securitySkillRef.findMany({ orderBy: { title: "asc" } });
    } catch {
      /* ignore — 빈 목록 반환 */
    }
  }

  const mapped = skills.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    domain: s.domain,
    tags: parseEnabledChecks(s.tags),
    checkIds: parseEnabledChecks(s.checkIds),
    updatedAt: s.updatedAt,
  }));

  const filtered = mapped.filter((s) => {
    if (domain && (s.domain || "").toLowerCase() !== domain) return false;
    if (tag && !s.tags.some((t) => t.toLowerCase() === tag)) return false;
    if (!q) return true;
    const hay = `${s.id} ${s.title} ${s.description} ${s.domain ?? ""} ${s.tags.join(" ")}`.toLowerCase();
    return hay.includes(q);
  });

  const allTags = Array.from(new Set(mapped.flatMap((s) => s.tags))).sort();
  const allDomains = Array.from(
    new Set(mapped.map((s) => s.domain).filter((d): d is string => Boolean(d))),
  ).sort();

  return NextResponse.json({
    skills: filtered,
    meta: { total: mapped.length, filtered: filtered.length, tags: allTags, domains: allDomains },
  });
}
