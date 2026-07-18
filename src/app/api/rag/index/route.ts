import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { itemAccessWhere } from "@/lib/workspace";
import { indexLibraryItem } from "@/lib/ragIndexing";
import { runToolGeneration } from "@/lib/toolGeneration";
import { getPlanOrFree } from "@/lib/plans";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 텍스트가 없는(스캔·이미지) 자료를 저장된 파일에서 다시 OCR 추출한다. */
async function reextractFromFile(item: {
  fileUrl: string;
  mimeType: string;
  userId: string;
}): Promise<string> {
  try {
    const res = await fetch(item.fileUrl);
    if (!res.ok) return "";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 20 * 1024 * 1024) return ""; // 20MB 초과는 스킵
    const settings = await prisma.userSettings.findUnique({
      where: { userId: item.userId },
    });
    const plan = getPlanOrFree(settings?.plan);
    const result = await runToolGeneration({
      toolId: "library-extract",
      userId: item.userId,
      modelTier: plan.modelTier,
      images: [{ data: buf.toString("base64"), mimeType: item.mimeType }],
    });
    return result.outputType === "markdown" ? result.text : "";
  } catch (err) {
    console.warn("re-extract (OCR) skipped:", err);
    return "";
  }
}

// 서재 항목을 청크로 나눠 임베딩하고 색인한다(재색인 시 기존 청크 교체).
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json().catch(() => ({}));
  const libraryItemId = String(body?.libraryItemId ?? "").trim();
  if (!libraryItemId) {
    return NextResponse.json({ error: "서재 항목을 선택해 주세요." }, { status: 400 });
  }

  const item = await prisma.libraryItem.findFirst({
    where: { id: libraryItemId, ...(await itemAccessWhere(userId)) },
  });
  if (!item) {
    return NextResponse.json({ error: "서재 항목을 찾을 수 없습니다." }, { status: 404 });
  }
  try {
    // 텍스트가 비어 있으면(스캔 PDF·이미지 등) 저장된 파일에서 OCR로 다시 추출해 본다.
    let workingItem = item;
    if (!item.extractedText?.trim()) {
      const ocrText = await reextractFromFile({
        fileUrl: item.fileUrl,
        mimeType: item.mimeType,
        userId,
      });
      if (ocrText.trim()) {
        await prisma.libraryItem.update({
          where: { id: item.id },
          data: { extractedText: ocrText },
        });
        workingItem = { ...item, extractedText: ocrText };
      }
    }

    const result = await indexLibraryItem(workingItem);
    if (!result) {
      return NextResponse.json(
        {
          error:
            "이 자료에서 텍스트를 읽어내지 못했어요. 스캔 품질이 낮거나 이미지에 글자가 거의 없을 수 있어요.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("rag index error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
