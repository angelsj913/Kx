import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 기본 6개월. DORMANT_DAYS env 로 테스트 가능 */
function dormantDays(): number {
  const n = Number(process.env.DORMANT_DAYS || 183);
  return Number.isFinite(n) && n > 0 ? n : 183;
}

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // 개발: 시크릿 없으면 로컬만 허용
    return process.env.NODE_ENV !== "production";
  }
  const header = request.headers.get("authorization") || request.headers.get("x-cron-secret");
  if (header === secret || header === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

async function run() {
  const cutoff = new Date(Date.now() - dormantDays() * 24 * 60 * 60 * 1000);
  const candidates = await prisma.user.findMany({
    where: {
      accountStatus: { not: "dormant" },
      OR: [
        { lastActiveAt: { lt: cutoff } },
        { lastActiveAt: null, emailVerified: { lt: cutoff } },
      ],
    },
    select: { id: true, email: true, name: true, dormantNotifiedAt: true },
    take: 200,
  });

  let converted = 0;
  let mailed = 0;

  for (const u of candidates) {
    const now = new Date();
    await prisma.user.update({
      where: { id: u.id },
      data: {
        accountStatus: "dormant",
        dormantAt: now,
      },
    });
    converted += 1;

    if (u.email && !u.dormantNotifiedAt) {
      const name = u.name || "고객";
      const subject = "[ZEFF AI] 본인의 계정이 휴면 상태로 전환되었습니다";
      const text =
        `${name}님, 안녕하세요.\n\n` +
        `장기간 접속이 확인되지 않아 본인 계정이 휴면 상태로 전환되었습니다.\n` +
        `다시 로그인하시면 계정이 정상(활성) 상태로 복구됩니다.\n\n` +
        `장기간 방치 시 서버 최적화를 위해 서재 데이터가 파기될 수 있으니, ` +
        `이용약관을 확인해 주세요.\n\n` +
        `ZEFF AI 드림`;
      const { sent } = await sendMail({ to: u.email, subject, text });
      if (sent) {
        await prisma.user.update({
          where: { id: u.id },
          data: { dormantNotifiedAt: now },
        });
        mailed += 1;
      }
    }
  }

  return { converted, mailed, scanned: candidates.length, dormantDays: dormantDays() };
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await run();
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(request: Request) {
  return GET(request);
}
