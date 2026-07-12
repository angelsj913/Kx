import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { runToolGeneration } from "@/lib/toolGeneration";
import { friendlyError } from "@/lib/errors";
import { listWhere, resolveScope, WorkspaceError } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let scope;
  try {
    scope = await resolveScope(request, session.user.id);
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  const items = await prisma.libraryItem.findMany({
    where: listWhere(scope, session.user.id),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      fileUrl: true,
      fileName: true,
      mimeType: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  let scope;
  try {
    scope = await resolveScope(request, userId);
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  const form = await request.formData();
  const file = form.get("file");
  const titleInput = String(form.get("title") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일을 첨부해 주세요." }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "파일이 너무 큽니다 (최대 20MB)." }, { status: 400 });
  }

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";

    const blob = await put(`library/${userId}/${Date.now()}-${file.name}`, buf, {
      access: "public",
      contentType: mimeType,
    });

    const { text: extractedText } = await runToolGeneration({
      toolId: "library-extract",
      userId,
      images: [{ data: buf.toString("base64"), mimeType }],
    }).then((result) => ({
      text: result.outputType === "markdown" ? result.text : "",
    }));

    const item = await prisma.libraryItem.create({
      data: {
        userId,
        workspaceId: scope.workspaceId,
        title: titleInput || file.name.replace(/\.[^.]+$/, ""),
        fileUrl: blob.url,
        fileName: file.name,
        mimeType,
        extractedText,
      },
    });

    return NextResponse.json({ item });
  } catch (err) {
    console.error("library upload error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
