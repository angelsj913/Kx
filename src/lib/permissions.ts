import { prisma } from "@/lib/prisma";

/**
 * 워크스페이스 Owner 여부 확인
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
 * 워크스페이스 관리 권한 확인 (Owner 또는 Admin)
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

    if (member?.role === "owner" || member?.role === "admin") {
      return true;
    }

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
