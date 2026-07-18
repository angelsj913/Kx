import { readFile } from "node:fs/promises";
import { basename, isAbsolute, relative, resolve } from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { friendlyError } from "@/lib/errors";
import { chunkText } from "@/lib/rag";
import { embedTexts } from "@/lib/embeddings";
import { verifyCronSecret } from "@/lib/cronAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_TITLE = "ZEFF AI RAG Source Extended";
const DEFAULT_FILE_NAME = "zeff-ai-rag-source-extended.md";
const DATASETS_DIR = resolve(process.cwd(), "docs/datasets");
const DEFAULT_SOURCE_PATH = resolve(DATASETS_DIR, "zeff-ai-rag-source-extended.md");

// sourcePath는 요청 입력값이라 docs/datasets 밖(예: ../../.env)을 가리키지 못하도록 반드시 이 안에서만 해석한다.
function resolveSourcePath(candidate?: string): string {
  if (!candidate) return DEFAULT_SOURCE_PATH;
  const resolved = resolve(DATASETS_DIR, candidate);
  const rel = relative(DATASETS_DIR, resolved);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error("sourcePath는 docs/datasets 디렉터리 내부 파일만 지정할 수 있습니다.");
  }
  return resolved;
}

function hasSecretAccess(request: Request): boolean {
  const secret = process.env.ZEFF_RAG_INDEX_SECRET || process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return verifyCronSecret(request, secret);
}

/**
 * GET은 관리자 세션 쿠키만으로 통과시키지 않는다 — 로그인한 관리자가 악성 링크를
 * 클릭하기만 해도(쿠키가 자동으로 실림) 이 라우트의 쓰기 동작이 실행되는
 * CSRF 경로였다. 세션 인증은 명시적 확인이 있는 POST에서만 허용하고, GET은
 * (curl 등으로) 시크릿을 직접 넣어 호출할 때만 허용한다.
 */
async function authorize(request: Request, opts: { allowSessionCookie: boolean }) {
  if (opts.allowSessionCookie) {
    const session = await auth();
    if (isAdminSession(session)) {
      return { session, via: "session" as const };
    }
  }
  if (hasSecretAccess(request)) {
    const session = await auth();
    return { session, via: "secret" as const };
  }
  return null;
}

async function resolveTargetUser(args: {
  userId?: string;
  userEmail?: string;
  fallbackUserId?: string | null;
}) {
  const userId = args.userId?.trim();
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) throw new Error("대상 userId 사용자를 찾을 수 없습니다.");
    return user;
  }

  const email = args.userEmail?.trim().toLowerCase();
  if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });
    if (!user) throw new Error("대상 userEmail 사용자를 찾을 수 없습니다.");
    return user;
  }

  const fallbackUserId = args.fallbackUserId?.trim();
  if (fallbackUserId) {
    const user = await prisma.user.findUnique({
      where: { id: fallbackUserId },
      select: { id: true, email: true, name: true },
    });
    if (!user) throw new Error("세션 사용자 정보를 찾을 수 없습니다.");
    return user;
  }

  throw new Error("userId 또는 userEmail이 필요합니다.");
}

async function resolveTargetWorkspace(workspaceId: string | null, userId: string) {
  if (!workspaceId) return null;

  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    include: { workspace: { select: { id: true, name: true } } },
  });
  if (!membership) {
    throw new Error("대상 사용자가 해당 워크스페이스 멤버가 아닙니다.");
  }
  return membership.workspace;
}

async function upsertAndIndexZeffRag(args: {
  userId: string;
  workspaceId: string | null;
  title?: string;
  fileName?: string;
  sourcePath?: string;
}) {
  const sourcePath = resolveSourcePath(args.sourcePath?.trim());
  // sourcePath를 다른 문서로 지정했는데 title/fileName을 안 주면 기본값("Extended"
  // 문서 제목)으로 떨어져서 그 문서 자리를 덮어써버리는 사고가 난다 — 기본 파일
  // 그대로일 때만 기존 기본값을 쓰고, 다른 파일이면 파일명 기준으로 새 제목을 만든다.
  const usingDefaultSource = sourcePath === DEFAULT_SOURCE_PATH;
  const derivedFileName = basename(sourcePath);
  const fileName =
    args.fileName?.trim() || (usingDefaultSource ? DEFAULT_FILE_NAME : derivedFileName);
  const title = args.title?.trim() || (usingDefaultSource ? DEFAULT_TITLE : derivedFileName);
  const extractedText = (await readFile(sourcePath, "utf8")).trim();

  if (!extractedText) {
    throw new Error("ZEFF RAG 원문이 비어 있습니다.");
  }

  const chunks = chunkText(extractedText);
  const { vectors, provider } = await embedTexts(chunks.map((c) => c.content));

  const existing = await prisma.libraryItem.findFirst({
    where: {
      userId: args.userId,
      workspaceId: args.workspaceId,
      title,
    },
    select: { id: true },
  });

  const item = existing
    ? await prisma.libraryItem.update({
        where: { id: existing.id },
        data: {
          title,
          fileUrl: `local://${fileName}`,
          fileName,
          mimeType: "text/markdown",
          extractedText,
        },
      })
    : await prisma.libraryItem.create({
        data: {
          userId: args.userId,
          workspaceId: args.workspaceId,
          title,
          fileUrl: `local://${fileName}`,
          fileName,
          mimeType: "text/markdown",
          extractedText,
        },
      });

  await prisma.$transaction([
    prisma.documentChunk.deleteMany({ where: { libraryItemId: item.id } }),
    prisma.documentChunk.createMany({
      data: chunks.map((chunk, i) => ({
        libraryItemId: item.id,
        userId: args.userId,
        workspaceId: args.workspaceId,
        idx: chunk.idx,
        content: chunk.content,
        embedding: vectors[i] ?? [],
        provider,
      })),
    }),
  ]);

  return {
    libraryItemId: item.id,
    title,
    sourcePath,
    chunks: chunks.length,
    provider,
  };
}

function readString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function paramsFromUrl(request: Request) {
  const url = new URL(request.url);
  return {
    userId: url.searchParams.get("userId") ?? undefined,
    userEmail: url.searchParams.get("userEmail") ?? undefined,
    workspaceId: url.searchParams.get("workspaceId") ?? undefined,
    title: url.searchParams.get("title") ?? undefined,
    fileName: url.searchParams.get("fileName") ?? undefined,
    sourcePath: url.searchParams.get("sourcePath") ?? undefined,
  };
}

async function run(
  request: Request,
  body: Record<string, unknown>,
  opts: { allowSessionCookie: boolean },
) {
  const authz = await authorize(request, opts);
  if (!authz) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const targetUser = await resolveTargetUser({
      userId: readString(body?.userId),
      userEmail: readString(body?.userEmail),
      fallbackUserId: authz.session?.user?.id ?? null,
    });
    const workspaceId =
      typeof body?.workspaceId === "string" && body.workspaceId.trim()
        ? body.workspaceId.trim()
        : null;
    const workspace = await resolveTargetWorkspace(workspaceId, targetUser.id);

    const result = await upsertAndIndexZeffRag({
      userId: targetUser.id,
      workspaceId: workspace?.id ?? null,
      title: readString(body?.title),
      fileName: readString(body?.fileName),
      sourcePath: readString(body?.sourcePath),
    });

    return NextResponse.json({
      ok: true,
      via: authz.via,
      user: {
        id: targetUser.id,
        email: targetUser.email ?? null,
        name: targetUser.name ?? null,
      },
      workspace: workspace ? { id: workspace.id, name: workspace.name } : null,
      ...result,
    });
  } catch (err) {
    console.error("zeff rag admin index error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return run(request, body, { allowSessionCookie: true });
}

export async function GET(request: Request) {
  return run(request, paramsFromUrl(request), { allowSessionCookie: false });
}
