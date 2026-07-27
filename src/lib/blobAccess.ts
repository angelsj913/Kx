import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { itemAccessWhere } from "@/lib/workspace";

/** 신규 업로드는 private. 레거시 public URL 은 프록시에서 fetch 폴백. */
export const BLOB_ACCESS = "private" as const;

const BLOB_HOST_RE =
  /^https:\/\/[a-z0-9.-]+\.(public|private)\.blob\.vercel-storage\.com\//i;

export function isVercelBlobUrl(url: string): boolean {
  return BLOB_HOST_RE.test(url);
}

/** Blob URL → store pathname (leading slash 제거, decode). */
export function blobPathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname.replace(/^\//, ""));
  } catch {
    return null;
  }
}

/**
 * 브라우저가 바로 쓸 수 있는 앱 프록시 URL.
 * 저장된 private/public Blob URL 을 `/api/files?u=…` 로 감싼다.
 */
export function toClientFileUrl(storedUrl: string | null | undefined): string | null {
  if (!storedUrl) return null;
  if (!isVercelBlobUrl(storedUrl)) return storedUrl;
  return `/api/files?u=${encodeURIComponent(storedUrl)}`;
}

export function mapClientFileUrl<T extends { fileUrl?: string | null }>(row: T): T {
  if (!row.fileUrl) return row;
  return { ...row, fileUrl: toClientFileUrl(row.fileUrl) };
}

/** 채팅 메시지 fileUrl + attachments[].url 을 프록시 URL 로 변환. */
export function mapMessageFilesForClient<
  T extends { fileUrl?: string | null; attachments?: unknown },
>(msg: T): T {
  const fileUrl = toClientFileUrl(msg.fileUrl) ?? msg.fileUrl;
  let attachments = msg.attachments;
  if (Array.isArray(attachments)) {
    attachments = attachments.map((a) => {
      if (
        a &&
        typeof a === "object" &&
        typeof (a as { url?: unknown }).url === "string"
      ) {
        const url = (a as { url: string }).url;
        return { ...a, url: toClientFileUrl(url) ?? url };
      }
      return a;
    });
  }
  return { ...msg, fileUrl, attachments };
}

/** 서버에서 Blob 바이트를 읽는다 (private SDK → public fetch 폴백). */
export async function fetchBlobBytes(url: string): Promise<Buffer | null> {
  if (!url || url.startsWith("local://")) return null;

  if (isVercelBlobUrl(url)) {
    try {
      const access = url.includes(".private.blob.") ? "private" : "public";
      const result = await get(url, { access });
      if (result?.statusCode === 200 && result.stream) {
        const ab = await new Response(result.stream).arrayBuffer();
        return Buffer.from(ab);
      }
    } catch {
      /* fall through */
    }
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * 로그인 사용자가 이 Blob URL 을 읽을 수 있는지.
 * - 본인 prefix (library|chat|history|inquiry / userId)
 * - chat/{userId}/{sessionId}/… → 세션 접근권
 * - DB 의 libraryItem / chatHistory.fileUrl 매칭
 */
export async function canAccessBlobUrl(
  userId: string,
  url: string,
): Promise<boolean> {
  if (!isVercelBlobUrl(url)) return false;

  const path = blobPathFromUrl(url);
  if (!path) return false;

  if (
    path.startsWith(`library/${userId}/`) ||
    path.startsWith(`chat/${userId}/`) ||
    path.startsWith(`history/${userId}/`) ||
    path.startsWith(`exports/${userId}/`) ||
    path.startsWith(`inquiry/${userId}/`)
  ) {
    return true;
  }

  const access = await itemAccessWhere(userId);

  // chat/{uploader}/{sessionId}/file — 세션 멤버십
  const chatMatch = path.match(/^chat\/[^/]+\/([^/]+)\//);
  if (chatMatch) {
    const sessionId = chatMatch[1]!;
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, ...access },
      select: { id: true },
    });
    if (session) return true;
  }

  const lib = await prisma.libraryItem.findFirst({
    where: { fileUrl: url, ...access },
    select: { id: true },
  });
  if (lib) return true;

  const hist = await prisma.chatHistory.findFirst({
    where: { fileUrl: url, session: access },
    select: { id: true },
  });
  if (hist) return true;

  // 첨부 JSON 에 URL 이 들어 있는 경우 (팀 세션)
  const attached = await prisma.$queryRaw<{ id: string }[]>`
    SELECT ch.id
    FROM "ChatHistory" ch
    INNER JOIN "ChatSession" cs ON cs.id = ch."sessionId"
    WHERE ch.attachments IS NOT NULL
      AND ch.attachments::text LIKE ${"%" + url.replace(/%/g, "\\%") + "%"}
      AND (
        cs."userId" = ${userId}
        OR (
          cs."workspaceId" IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM "WorkspaceMember" wm
            WHERE wm."workspaceId" = cs."workspaceId" AND wm."userId" = ${userId}
          )
        )
      )
    LIMIT 1
  `;
  if (attached.length > 0) return true;

  return false;
}
