import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createWorkspace, getMyWorkspaces } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const workspaces = await getMyWorkspaces(session.user.id);
  return NextResponse.json({ workspaces });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "워크스페이스 이름을 입력해 주세요." }, { status: 400 });
  }
  if (name.length > 60) {
    return NextResponse.json({ error: "이름은 60자 이내로 입력해 주세요." }, { status: 400 });
  }

  const workspace = await createWorkspace(session.user.id, name);
  return NextResponse.json({
    workspace: { id: workspace.id, name: workspace.name, role: "owner", memberCount: 1 },
  });
}
