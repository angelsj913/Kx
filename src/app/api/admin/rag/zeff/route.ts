import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { friendlyError } from "@/lib/errors";
import { chunkText } from "@/lib/rag";
import { embedTexts } from "@/lib/embeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_TITLE = "ZEFF AI RAG Source Extended";
const DEFAULT_FILE_NAME = "zeff-ai-rag-source-extended.md";
const DEFAULT_SOURCE_PATH = resolve(process.cwd(), "docs/datasets/zeff-ai-rag-source-extended.md");

function hasSecretAccess(request: Request): boolean {
  if (request.headers.get("x-vercel-cron") === "1") return true;

  const secret = process.env.ZEFF_RAG_INDEX_SECRET || process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const header =
    request.headers.get("authorization") ||
    request.headers.get("x-rag-secret") ||
    request.headers.get("x-cron-secret");
  if (header === secret || header === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

async function authorize(request: Request) {
  const session = await auth();
  if (isAdminSession(session)) {
    return { session, via: "session" as const };
  }
  if (hasSecretAccess(request)) {
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
  const title = args.title?.trim() || DEFAULT_TITLE;
  const fileName = args.fileName?.trim() || DEFAULT_FILE_NAME;
  const sourcePath = args.sourcePath?.trim() || DEFAULT_SOURCE_PATH;
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

async function run(request: Request, body: Record<string, unknown>) {
  const authz = await authorize(request);
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
  return run(request, body);
}

export async function GET(request: Request) {
  return run(request, paramsFromUrl(request));
}
