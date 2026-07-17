import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["billing", "bug", "account", "feature", "etc"];

/** 로그인한 사용자의 문의 내역 목록 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const inquiries = await prisma.inquiry.findMany({
    where: { userId: session.user.id },
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

/** 1:1 문의 접수 (비로그인도 가능, 로그인 시 내역에 연결) */
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const form = await request.formData();
  const type = String(form.get("type") ?? "etc");
  const subject = String(form.get("subject") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
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
    const buf = Buffer.from(await file.arrayBuffer());
    const blob = await put(
      `inquiry/${userId ?? "guest"}/${Date.now()}-${file.name}`,
      buf,
      {
        access: "public",
        contentType: file.type || "application/octet-stream",
        addRandomSuffix: true,
      }
    );
    fileUrl = blob.url;
    fileName = file.name;
  }

  const inquiry = await prisma.inquiry.create({
    data: { userId, type: safeType, subject, body, email, fileUrl, fileName },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: inquiry.id });
}
