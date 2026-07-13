import { prisma } from "@/lib/prisma";

/**
 * 워크스페이스 Owner 여부 확인 (서버 전용)
 * @param userId 현재 로그인한 유저 ID
 * @param workspaceId 확인할 워크스페이스 ID
 * @returns Owner이면 true, 아니면 false
 */
export async function isWorkspaceOwner(
  userId: string | null | undefined,
  workspaceId: string
): Promise<boolean> {
  if (!userId || !workspaceId) return false;

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true },
    });

    return workspace?.ownerId === userId;
  } catch (error) {
    console.error("[permissions] isWorkspaceOwner error:", error);
    return false;
  }
}

/**
 * 워크스페이스 Owner 또는 Admin 여부 확인 (필요시 사용)
 */
export async function canManageWorkspace(
  userId: string | null | undefined,
  workspaceId: string
): Promise<boolean> {
  if (!userId || !workspaceId) return false;

  try {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      select: { role: true },
    });

    // owner이거나 admin role을 가진 경우
    if (member?.role === "owner" || member?.role === "admin") {
      return true;
    }

    // owner 테이블 직접 확인
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true },
    });

    return workspace?.ownerId === userId;
  } catch (error) {
    console.error("[permissions] canManageWorkspace error:", error);
    return false;
  }
}
