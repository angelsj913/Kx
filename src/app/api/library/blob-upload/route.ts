import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/auth";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 클라이언트 직접 Blob 업로드용 토큰 발급.
 * 파일을 서버리스 함수 본문으로 보내면 Vercel 4.5MB 한도에 걸려 "Request Entity Too Large"(413,
 * 평문)가 떨어지고 클라이언트 res.json()이 깨진다. 대신 클라이언트가 Blob으로 직접 올리고,
 * 서버는 완결(JSON) 요청만 받는다(/api/library POST의 JSON 분기).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async () => ({
        addRandomSuffix: true,
        maximumSizeInBytes: MAX_UPLOAD_BYTES,
        allowedContentTypes: [
          "application/pdf",
          "image/png",
          "image/jpeg",
          "image/webp",
          "image/gif",
          "text/plain",
          "text/markdown",
          "text/csv",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        tokenPayload: JSON.stringify({ userId }),
      }),
      // 완결은 별도 finalize(POST /api/library, JSON)에서 처리한다.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "업로드 토큰 발급에 실패했습니다." },
      { status: 400 },
    );
  }
}
