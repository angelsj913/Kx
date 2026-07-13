import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { friendlyError } from "@/lib/errors";
import { isAdminEmail } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["등록", "처리중", "답변완료"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user.isAdmin !== true && !isAdminEmail(session.user.email))
    ) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reply = typeof body?.reply === "string" ? body.reply.trim() : undefined;
    const status = typeof body?.status === "string" ? body.status : undefined;

    if (status && !STATUSES.includes(status)) {
      return NextResponse.json({ error: "잘못된 상태입니다." }, { status: 400 });
    }

    const inquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) {
      return NextResponse.json({ error: "문의를 찾을 수 없습니다." }, { status: 404 });
    }

    const updated = await prisma.inquiry.update({
      where: { id },
      data: {
        ...(reply !== undefined ? { reply } : {}),
        status: status ?? (reply ? "답변완료" : inquiry.status),
      },
    });

    // 답변 내용이 있으면 문의자 이메일로 발송(키가 없으면 조용히 스킵)
    let emailSent = false;
    if (reply && inquiry.email) {
      try {
        const result = await sendMail({
          to: inquiry.email,
          subject: `[ZEFF AI] 문의 답변: ${inquiry.subject}`,
          text: `안녕하세요, ZEFF AI입니다.\n\n문의하신 내용에 대한 답변입니다.\n\n[문의] ${inquiry.subject}\n\n[답변]\n${reply}\n\n감사합니다.`,
        });
        emailSent = result.sent;
      } catch (e) {
        console.error("inquiry reply mail error:", e);
      }
    }

    return NextResponse.json({ ok: true, inquiry: updated, emailSent });
  } catch (err) {
    console.error("admin inquiry update error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
