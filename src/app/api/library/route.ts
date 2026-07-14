import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { runToolGeneration } from "@/lib/toolGeneration";
import { friendlyError } from "@/lib/errors";
import { resolveScope, WorkspaceError } from "@/lib/workspace";
import { getPlanOrFree } from "@/lib/plans";
import type { Prisma } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 서재 목록 필터
 * - personal: 내 서재만 (workspaceId null)
 * - shared: 활성 팀 워크스페이스 공유 서재만
 * - (legacy) 헤더만 오면 resolveScope 결과 사용하되 personal은 null 스코프를 내 서재로 취급
 */
function libraryWhere(
  userId: string,
  workspaceId: string | null,
  mode: "personal" | "shared" | "auto",
): Prisma.LibraryItemWhereInput {
  if (mode === "personal" || (mode === "auto" && !workspaceId)) {
    return { userId, workspaceId: null };
  }
  if (mode === "shared" || workspaceId) {
    if (!workspaceId) {
      // 공유 탭인데 팀 WS 없음 → 빈 결과
      return { id: "__none__" };
    }
    return { workspaceId };
  }
  return { userId, workspaceId: null };
}

function parseMode(request: Request): "personal" | "shared" | "auto" {
  const url = new URL(request.url);
  const scope = (url.searchParams.get("scope") ?? "").trim().toLowerCase();
  if (scope === "personal" || scope === "mine") return "personal";
  if (scope === "shared" || scope === "team") return "shared";
  return "auto";
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;
  const mode = parseMode(request);

  let scope: { workspaceId: string | null };
  try {
    scope = await resolveScope(request, userId);
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  // shared 요청인데 워크스페이스 미선택
  if (mode === "shared" && !scope.workspaceId) {
    return NextResponse.json({
      items: [],
      usage: null,
      scope: "shared",
      workspaceId: null,
      needWorkspace: true,
    });
  }

  const where = libraryWhere(userId, scope.workspaceId, mode);
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });
  const plan = getPlanOrFree(settings?.plan);

  const [count, items] = await Promise.all([
    prisma.libraryItem.count({ where }),
    prisma.libraryItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        fileUrl: true,
        fileName: true,
        mimeType: true,
        createdAt: true,
        workspaceId: true,
      },
    }),
  ]);

  return NextResponse.json({
    items,
    usage: { used: count, max: plan.libraryMax, plan: plan.id },
    scope: mode === "auto" ? (scope.workspaceId ? "shared" : "personal") : mode,
    workspaceId: scope.workspaceId,
    needWorkspace: false,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;
  const mode = parseMode(request);

  let scope: { workspaceId: string | null };
  try {
    scope = await resolveScope(request, userId);
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  // 공유 업로드는 팀 WS 필수
  const forcePersonal = mode === "personal";
  const workspaceId = forcePersonal ? null : scope.workspaceId;
  if (mode === "shared" && !workspaceId) {
    return NextResponse.json(
      { error: "공유 서재에 올리려면 팀 워크스페이스를 선택하세요.", code: "NEED_WORKSPACE" },
      { status: 400 },
    );
  }

  const where = libraryWhere(userId, workspaceId, forcePersonal ? "personal" : workspaceId ? "shared" : "personal");
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const plan = getPlanOrFree(settings?.plan);
  const currentCount = await prisma.libraryItem.count({ where });
  if (currentCount >= plan.libraryMax) {
    return NextResponse.json(
      {
        error: `서재 저장 한도(${plan.libraryMax}개)에 도달했습니다. ${plan.name} 플랜 기준입니다.`,
        code: "LIBRARY_QUOTA",
        used: currentCount,
        max: plan.libraryMax,
      },
      { status: 402 },
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  const titleInput = String(form.get("title") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일을 첨부해 주세요." }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "파일이 너무 큽니다 (최대 20MB)." }, { status: 400 });
  }

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";

    const blob = await put(`library/${userId}/${Date.now()}-${file.name}`, buf, {
      access: "public",
      contentType: mimeType,
    });

    // 추출은 업로드 병목 — 실패해도 저장은 유지
    let extractedText = "";
    try {
      const result = await runToolGeneration({
        toolId: "library-extract",
        userId,
        modelTier: plan.modelTier,
        images: [{ data: buf.toString("base64"), mimeType }],
      });
      extractedText = result.outputType === "markdown" ? result.text : "";
    } catch (err) {
      console.warn("library extract skipped:", err);
    }

    const item = await prisma.libraryItem.create({
      data: {
        userId,
        workspaceId,
        title: titleInput || file.name.replace(/\.[^.]+$/, ""),
        fileUrl: blob.url,
        fileName: file.name,
        mimeType,
        extractedText,
      },
    });

    return NextResponse.json({
      item,
      usage: { used: currentCount + 1, max: plan.libraryMax, plan: plan.id },
    });
  } catch (err) {
    console.error("library upload error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
