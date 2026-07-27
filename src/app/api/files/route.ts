import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import { requireUserId } from "@/lib/apiAuth";
import {
  canAccessBlobUrl,
  fetchBlobBytes,
  isVercelBlobUrl,
} from "@/lib/blobAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Private(및 레거시 public) Blob 을 인증된 사용자에게 스트리밍한다.
 * 클라이언트는 저장 URL 대신 `/api/files?u=…` 를 사용한다.
 */
export async function GET(request: Request) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const url = new URL(request.url).searchParams.get("u")?.trim() ?? "";
  if (!url || !isVercelBlobUrl(url)) {
    return NextResponse.json({ error: "유효하지 않은 파일입니다." }, { status: 400 });
  }

  const session = await auth();
  const allowed =
    isAdminSession(session) || (await canAccessBlobUrl(userId, url));
  if (!allowed) {
    return NextResponse.json({ error: "파일을 열 권한이 없습니다." }, { status: 403 });
  }

  const buf = await fetchBlobBytes(url);
  if (!buf) {
    return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
  }

  const path = decodeURIComponent(new URL(url).pathname);
  const name = path.split("/").pop() || "file";
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  const type =
    ext === "png"
      ? "image/png"
      : ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "webp"
          ? "image/webp"
          : ext === "gif"
            ? "image/gif"
            : ext === "pdf"
              ? "application/pdf"
              : ext === "pptx"
                ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                : ext === "xlsx"
                  ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  : ext === "docx"
                    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    : ext === "md"
                      ? "text/markdown; charset=utf-8"
                      : "application/octet-stream";

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": type,
      "Content-Length": String(buf.length),
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(name)}`,
    },
  });
}
