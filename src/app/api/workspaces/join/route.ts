import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { joinByInviteCode, WorkspaceError } from "@/lib/workspace";
import { assertRateLimit, clientIp, RateLimitError } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 초대 코드로 워크스페이스 가입 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const code = String(body?.code ?? "").trim();
  if (!code) {
    return NextResponse.json({ error: "초대 코드를 입력해 주세요." }, { status: 400 });
  }

  try {
    // 코드 공간(33^8)이 넓긴 하지만, 대입 자체를 막을 방법이 전혀 없었다.
    await assertRateLimit("workspace-join:user", session.user.id, { max: 10, windowSeconds: 300 });
    await assertRateLimit("workspace-join:ip", clientIp(request), { max: 20, windowSeconds: 300 });
    const result = await joinByInviteCode(session.user.id, code);
    return NextResponse.json({
      ok: true,
      alreadyMember: result.alreadyMember,
      workspace: {
        id: result.workspace.id,
        name: result.workspace.name,
        imageUrl: result.workspace.imageUrl,
      },
    });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[workspace join]", err);
    return NextResponse.json({ error: "가입 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
