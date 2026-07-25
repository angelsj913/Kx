import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/apiAuth";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertRateLimit, clientIp, RateLimitError } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["billing", "bug", "account", "feature", "etc"];

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

/** 로그인한 사용자의 문의 내역 목록 */
export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const inquiries = await prisma.inquiry.findMany({
    where: { userId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      subject: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ inquiries });
}

/** 1:1 문의 접수 — 로그인 필수 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "문의하려면 로그인이 필요합니다.", needLogin: true },
        { status: 401 },
      );
    }
    const userId = session.user.id;

    await assertRateLimit("inquiry:user", userId, { max: 10, windowSeconds: 3600 });
    await assertRateLimit("inquiry:ip", clientIp(request), { max: 20, windowSeconds: 3600 });

    const form = await request.formData();
    const type = String(form.get("type") ?? "etc");
    const subject = String(form.get("subject") ?? "").trim();
    const body = String(form.get("body") ?? "").trim();
    const email = String(form.get("email") ?? "").trim() || (session.user.email ?? "");
    const file = form.get("file");

    if (!subject || !body || !email) {
      return NextResponse.json({ error: "제목, 내용, 이메일을 모두 입력해 주세요." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "올바른 이메일 주소를 입력해 주세요." }, { status: 400 });
    }
    const safeType = ALLOWED_TYPES.includes(type) ? type : "etc";

    let fileUrl: string | undefined;
    let fileName: string | undefined;
    if (file instanceof File && file.size > 0) {
      if (file.size > 12 * 1024 * 1024) {
        return NextResponse.json({ error: "첨부 파일은 최대 12MB까지 가능합니다." }, { status: 400 });
      }
      const mime = (file.type || "").toLowerCase();
      if (!ALLOWED_MIME.has(mime)) {
        return NextResponse.json(
          { error: "첨부는 PNG, JPEG, WebP, GIF, PDF만 가능합니다." },
          { status: 400 },
        );
      }
      const buf = Buffer.from(await file.arrayBuffer());
      // private: 인증된 사용자만 업로드. URL은 저장하되 공개 CDN 남용을 줄인다.
      const blob = await put(`inquiry/${userId}/${Date.now()}-${file.name}`, buf, {
        access: "private",
        contentType: mime,
        addRandomSuffix: true,
      });
      fileUrl = blob.url;
      fileName = file.name;
    }

    const inquiry = await prisma.inquiry.create({
      data: { userId, type: safeType, subject, body, email, fileUrl, fileName },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: inquiry.id });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error("inquiry error:", err);
    return NextResponse.json({ error: "문의 접수에 실패했습니다." }, { status: 500 });
  }
}
