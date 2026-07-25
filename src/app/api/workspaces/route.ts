import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/apiAuth";
import { createWorkspace, getMyWorkspaces } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const workspaces = await getMyWorkspaces(userId);
  return NextResponse.json({ workspaces });
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const body = await request.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "워크스페이스 이름을 입력해 주세요." }, { status: 400 });
  }
  if (name.length > 60) {
    return NextResponse.json({ error: "이름은 60자 이내로 입력해 주세요." }, { status: 400 });
  }

  const workspace = await createWorkspace(userId, name);
  return NextResponse.json({
    workspace: { id: workspace.id, name: workspace.name, role: "owner", memberCount: 1 },
  });
}
