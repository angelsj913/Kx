import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

// 팀 워크스페이스 서버 헬퍼 — 여러 명이 같은 세션·서재를 공유하는 협업 계층.
// 역할 위계: owner > admin > member

export type WorkspaceRole = "owner" | "admin" | "member";

const ROLE_RANK: Record<WorkspaceRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

/** a 역할이 b 역할 이상의 권한을 갖는지 */
export function roleAtLeast(a: string | null | undefined, b: WorkspaceRole): boolean {
  const rank = ROLE_RANK[(a as WorkspaceRole) ?? "member"] ?? 0;
  return rank >= ROLE_RANK[b];
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  role: WorkspaceRole;
  memberCount: number;
  createdAt: string;
  imageUrl?: string | null;
  inviteCode?: string | null;
}

/** 요청 처리 중 조기 반환을 위한 에러(라우트에서 status로 변환). */
export class WorkspaceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "WorkspaceError";
  }
}

/** 내가 속한 워크스페이스 목록(역할·멤버 수 포함). */
export async function getMyWorkspaces(userId: string): Promise<WorkspaceSummary[]> {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: { _count: { select: { members: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((m) => ({
    id: m.workspaceId,
    name: m.workspace.name,
    role: m.role as WorkspaceRole,
    memberCount: m.workspace._count.members,
    createdAt: m.workspace.createdAt.toISOString(),
    imageUrl: m.workspace.imageUrl,
    inviteCode: m.role === "owner" || m.role === "admin" ? m.workspace.inviteCode : null,
  }));
}

/** 내 멤버십(없으면 null). */
export function getMembership(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
}

/** 멤버가 아니면 WorkspaceError(403). 반환값은 멤버십. */
export async function requireMembership(workspaceId: string, userId: string) {
  const membership = await getMembership(workspaceId, userId);
  if (!membership) {
    throw new WorkspaceError("이 워크스페이스에 접근할 권한이 없습니다.", 403);
  }
  return membership;
}

/** 최소 역할 미달이면 WorkspaceError(403). */
export async function requireRole(
  workspaceId: string,
  userId: string,
  minRole: WorkspaceRole,
) {
  const membership = await requireMembership(workspaceId, userId);
  if (!roleAtLeast(membership.role, minRole)) {
    throw new WorkspaceError("이 작업을 수행할 권한이 없습니다.", 403);
  }
  return membership;
}

/** 내가 접근 가능한 워크스페이스 id 목록. */
export async function accessibleWorkspaceIds(userId: string): Promise<string[]> {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    select: { workspaceId: true },
  });
  return memberships.map((m) => m.workspaceId);
}

/**
 * 요청의 활성 워크스페이스 스코프를 해석한다.
 * `X-Workspace-Id` 헤더 또는 `?workspace=` 쿼리에서 읽고 멤버십을 검증한다.
 * 값이 없으면 개인 스코프(null). 멤버가 아니면 WorkspaceError(403).
 */
export async function resolveScope(
  request: Request,
  userId: string,
): Promise<{ workspaceId: string | null }> {
  const headerId = request.headers.get("x-workspace-id");
  const url = new URL(request.url);
  const queryId = url.searchParams.get("workspace");
  const raw = (headerId ?? queryId ?? "").trim();

  if (!raw || raw === "personal") return { workspaceId: null };

  await requireMembership(raw, userId);
  return { workspaceId: raw };
}

/**
 * 목록 조회용 where 절.
 * 개인 스코프면 내 개인 항목(workspaceId=null)만, 워크스페이스 스코프면 그 공유 항목 전체.
 */
export function listWhere(
  scope: { workspaceId: string | null },
  userId: string,
): { userId: string; workspaceId: null } | { workspaceId: string } {
  return scope.workspaceId
    ? { workspaceId: scope.workspaceId }
    : { userId, workspaceId: null };
}

/**
 * 단일 항목 접근용 where 조각.
 * 내가 만든 항목이거나, 내가 속한 워크스페이스의 공유 항목이면 접근 가능.
 */
export async function itemAccessWhere(userId: string) {
  const ids = await accessibleWorkspaceIds(userId);
  return ids.length
    ? { OR: [{ userId }, { workspaceId: { in: ids } }] }
    : { userId };
}

/** 짧은 초대 코드 (8자, 혼동 문자 제외). */
export function newInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}

/** 새 워크스페이스 생성 + 생성자를 owner 멤버로 등록. */
export async function createWorkspace(userId: string, name: string) {
  return prisma.workspace.create({
    data: {
      name,
      ownerId: userId,
      inviteCode: newInviteCode(),
      members: { create: { userId, role: "owner" } },
    },
  });
}

/** 초대 토큰(URL-safe). */
export function newInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

export const INVITE_TTL_DAYS = 14;

/** 코드로 워크스페이스 가입 (이미 멤버면 그대로 반환). */
export async function joinByInviteCode(userId: string, rawCode: string) {
  const code = rawCode.trim().toUpperCase().replace(/\s+/g, "");
  if (code.length < 4) throw new WorkspaceError("초대 코드를 확인해 주세요.", 400);

  const ws = await prisma.workspace.findFirst({
    where: { inviteCode: code },
  });
  if (!ws) throw new WorkspaceError("유효하지 않은 초대 코드입니다.", 404);

  const existing = await getMembership(ws.id, userId);
  if (existing) return { workspace: ws, alreadyMember: true as const };

  await prisma.workspaceMember.create({
    data: { workspaceId: ws.id, userId, role: "member" },
  });
  return { workspace: ws, alreadyMember: false as const };
}

/** 대표 권한 양도 — 대상 멤버를 owner로, 기존 owner를 member로. */
export async function transferOwnership(
  workspaceId: string,
  currentOwnerId: string,
  newOwnerId: string,
) {
  if (currentOwnerId === newOwnerId) {
    throw new WorkspaceError("이미 대표인 멤버입니다.", 400);
  }
  await requireRole(workspaceId, currentOwnerId, "owner");
  const target = await getMembership(workspaceId, newOwnerId);
  if (!target) throw new WorkspaceError("양도 대상이 멤버가 아닙니다.", 400);

  await prisma.$transaction([
    prisma.workspace.update({
      where: { id: workspaceId },
      data: { ownerId: newOwnerId },
    }),
    prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId: newOwnerId } },
      data: { role: "owner" },
    }),
    prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId: currentOwnerId } },
      data: { role: "member" },
    }),
  ]);
}
