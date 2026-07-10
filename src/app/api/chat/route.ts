import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { runAgentPipeline } from "@/lib/agents";
import { runToolGeneration } from "@/lib/toolGeneration";
import { getTool } from "@/lib/tools";
import { friendlyError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StoredAttachment {
  url: string;
  filename: string;
  mimeType: string;
}

type StreamEvent =
  | { type: "status"; key: string; sessionId: string }
  | { type: "done"; sessionId: string; message: Record<string, unknown> }
  | { type: "error"; sessionId: string; message: string };

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  const contentType = request.headers.get("content-type") ?? "";
  let sessionId: string | null = null;
  let text = "";
  let quickToolId: string | null = null;
  const uploads: File[] = [];

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    text = String(form.get("text") ?? "").trim();
    sessionId = (form.get("sessionId") as string) || null;
    quickToolId = (form.get("quickToolId") as string) || null;
    for (const entry of form.getAll("files")) {
      if (entry instanceof File) uploads.push(entry);
    }
  } else {
    const body = await request.json().catch(() => ({}));
    text = typeof body?.text === "string" ? body.text.trim() : "";
    sessionId = typeof body?.sessionId === "string" ? body.sessionId : null;
    quickToolId = typeof body?.quickToolId === "string" ? body.quickToolId : null;
  }

  if (!text && uploads.length === 0) {
    return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
  }

  let chatSession;
  if (sessionId) {
    chatSession = await prisma.chatSession.findFirst({ where: { id: sessionId, userId } });
    if (!chatSession) {
      return NextResponse.json({ error: "대화를 찾을 수 없습니다." }, { status: 404 });
    }
  } else {
    chatSession = await prisma.chatSession.create({ data: { userId } });
  }
  const resolvedSessionId = chatSession.id;

  const storedAttachments: StoredAttachment[] = [];
  const inlineFiles: { data: string; mimeType: string }[] = [];
  for (const file of uploads) {
    const buf = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";
    const blob = await put(
      `chat/${userId}/${resolvedSessionId}/${Date.now()}-${file.name}`,
      buf,
      { access: "public", contentType: mimeType }
    );
    storedAttachments.push({ url: blob.url, filename: file.name, mimeType });
    inlineFiles.push({ data: buf.toString("base64"), mimeType });
  }

  await prisma.chatHistory.create({
    data: {
      sessionId: resolvedSessionId,
      role: "user",
      text,
      attachments: storedAttachments.length
        ? (storedAttachments as unknown as Prisma.InputJsonValue)
        : undefined,
    },
  });
  await prisma.chatSession.update({
    where: { id: resolvedSessionId },
    data: {
      updatedAt: new Date(),
      ...(chatSession.title ? {} : { title: text.slice(0, 40) || "새 대화" }),
    },
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: StreamEvent) {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      }

      try {
        if (quickToolId) {
          send({ type: "status", key: "status.quicktool.generating", sessionId: resolvedSessionId });

          const quickTool = getTool(quickToolId);
          const result = await runToolGeneration({
            toolId: quickToolId,
            text,
            userId,
            audio: quickTool?.inputType === "audio" ? inlineFiles[0] : undefined,
            images: quickTool?.inputType === "image" ? inlineFiles : undefined,
            onAttempt: () =>
              send({ type: "status", key: "status.ai.trying", sessionId: resolvedSessionId }),
            onUploadStart: () =>
              send({ type: "status", key: "status.file.uploading", sessionId: resolvedSessionId }),
          });

          let replyText: string;
          let resultData: string | undefined;
          let structuredKind: string | undefined;
          let fileUrl: string | undefined;
          let fileName: string | undefined;

          if (result.outputType === "markdown") {
            replyText = result.text;
          } else if (result.outputType === "structured") {
            replyText = `${result.tool.short} 초안을 완성했어요. 아래에서 바로 확인하고 편집할 수 있어요.`;
            resultData = result.resultData;
            structuredKind = result.structuredKind;
          } else {
            replyText = `${result.tool.short} 파일을 만들었어요. 아래에서 확인하고 다운로드하세요.`;
            resultData = result.resultData;
            fileUrl = result.file.url;
            fileName = result.file.filename;
          }

          const assistantRow = await prisma.chatHistory.create({
            data: {
              sessionId: resolvedSessionId,
              role: "model",
              text: replyText,
              agentId: `quicktool:${quickToolId}`,
              provider: result.meta.provider,
              modelName: result.meta.model,
              attempts: result.meta.attempts,
              outputType: result.outputType,
              structuredKind,
              resultData,
              fileUrl,
              fileName,
            },
          });
          await prisma.chatSession.update({
            where: { id: resolvedSessionId },
            data: { updatedAt: new Date() },
          });

          send({ type: "done", sessionId: resolvedSessionId, message: assistantRow });
        } else {
          send({ type: "status", key: "status.agent.selecting", sessionId: resolvedSessionId });

          const history = await prisma.chatHistory.findMany({
            where: { sessionId: resolvedSessionId },
            orderBy: { createdAt: "asc" },
          });
          const messages: ChatMessage[] = history.map((m, i) => ({
            role: m.role === "model" ? "model" : "user",
            text: m.text,
            files: i === history.length - 1 && inlineFiles.length ? inlineFiles : undefined,
          }));

          let firstAttempt = true;
          const result = await runAgentPipeline({
            text,
            hasFiles: inlineFiles.length > 0,
            messages,
            onAttempt: () => {
              send({
                type: "status",
                key: firstAttempt ? "status.agent.selected" : "status.ai.trying",
                sessionId: resolvedSessionId,
              });
              firstAttempt = false;
            },
          });

          const assistantRow = await prisma.chatHistory.create({
            data: {
              sessionId: resolvedSessionId,
              role: "model",
              text: result.text,
              agentId: result.agentId,
              provider: result.provider,
              modelName: result.model,
              attempts: result.attempts,
            },
          });
          await prisma.chatSession.update({
            where: { id: resolvedSessionId },
            data: { updatedAt: new Date() },
          });

          send({ type: "done", sessionId: resolvedSessionId, message: assistantRow });
        }
      } catch (err) {
        console.error("chat stream error:", err);
        send({ type: "error", sessionId: resolvedSessionId, message: friendlyError(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
}
