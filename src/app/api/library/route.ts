import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { runToolGeneration } from "@/lib/toolGeneration";
import { friendlyError } from "@/lib/errors";
import { resolveScope, WorkspaceError } from "@/lib/workspace";
import { getPlanOrFree } from "@/lib/plans";
import { indexLibraryItem } from "@/lib/ragIndexing";
import { extractPdfText, hasUsableText } from "@/lib/pdfText";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "@/lib/constants";
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
        _count: { select: { chunks: true } },
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

  // ── 입력 파싱: (신규) 클라이언트 직접 업로드 JSON 완결 / (레거시) FormData ──
  // JSON 경로는 파일을 함수 본문으로 보내지 않으므로 4.5MB 413 문제가 없다.
  const reqContentType = request.headers.get("content-type") || "";
  let buf: Buffer;
  let mimeType: string;
  let fileName: string;
  let titleInput: string;
  let blobUrl: string;

  try {
    if (reqContentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      blobUrl = String(body?.blobUrl ?? "");
      fileName = String(body?.fileName ?? "file");
      mimeType = String(body?.mimeType ?? "application/octet-stream");
      titleInput = String(body?.title ?? "").trim();
      const size = Number(body?.size ?? 0);

      // 우리 Blob 스토어의 URL만 허용(임의 URL 인젝션 방지)
      if (!/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(blobUrl)) {
        return NextResponse.json({ error: "유효하지 않은 업로드입니다." }, { status: 400 });
      }
      if (size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: `파일이 너무 큽니다 (최대 ${MAX_UPLOAD_MB}MB).` },
          { status: 400 },
        );
      }
      // 추출·색인을 위해 Blob 내용을 가져온다(작은 JSON 요청과 별개).
      const fetched = await fetch(blobUrl);
      if (!fetched.ok) {
        return NextResponse.json({ error: "업로드한 파일을 읽지 못했습니다." }, { status: 400 });
      }
      buf = Buffer.from(await fetched.arrayBuffer());
    } else {
      const form = await request.formData();
      const file = form.get("file");
      titleInput = String(form.get("title") ?? "").trim();
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "파일을 첨부해 주세요." }, { status: 400 });
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: `파일이 너무 큽니다 (최대 ${MAX_UPLOAD_MB}MB).` },
          { status: 400 },
        );
      }
      buf = Buffer.from(await file.arrayBuffer());
      mimeType = file.type || "application/octet-stream";
      fileName = file.name;
      const blob = await put(`library/${userId}/${Date.now()}-${file.name}`, buf, {
        access: "public",
        contentType: mimeType,
        addRandomSuffix: true,
      });
      blobUrl = blob.url;
    }

    // 추출은 업로드 병목 — 실패해도 저장은 유지
    // 1) PDF에 텍스트 레이어가 있으면 AI 없이 즉시·무료로 추출한다(Gemini 크레딧 무관).
    let extractedText = "";
    if (mimeType === "application/pdf") {
      const layer = await extractPdfText(buf);
      if (hasUsableText(layer)) extractedText = layer;
    }
    // 2) 텍스트가 부족하면(스캔 이미지 PDF·사진 등) 멀티모달 OCR로 보강한다.
    if (!hasUsableText(extractedText)) {
      try {
        const result = await runToolGeneration({
          toolId: "library-extract",
          userId,
          modelTier: plan.modelTier,
          images: [{ data: buf.toString("base64"), mimeType }],
        });
        const ocr = result.outputType === "markdown" ? result.text : "";
        if (ocr.trim().length > extractedText.trim().length) extractedText = ocr;
      } catch (err) {
        console.warn("library extract skipped:", err);
      }
    }

    const item = await prisma.libraryItem.create({
      data: {
        userId,
        workspaceId,
        title: titleInput || fileName.replace(/\.[^.]+$/, ""),
        fileUrl: blobUrl,
        fileName,
        mimeType,
        extractedText,
      },
    });

    // 검색 가능하게 즉시 색인 — 실패해도 서재 저장 자체는 이미 유효하니 무시한다.
    let indexed = false;
    try {
      const indexResult = await indexLibraryItem(item);
      indexed = !!indexResult;
    } catch (err) {
      console.warn("library auto-index skipped:", err);
    }

    return NextResponse.json({
      item,
      indexed,
      usage: { used: currentCount + 1, max: plan.libraryMax, plan: plan.id },
    });
  } catch (err) {
    console.error("library upload error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
