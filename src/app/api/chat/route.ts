import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { runBackendRoute } from "@/lib/backendRoute";
import { runToolGeneration } from "@/lib/toolGeneration";
import { getTool } from "@/lib/tools";
import { friendlyError } from "@/lib/errors";
import { itemAccessWhere, resolveScope, WorkspaceError } from "@/lib/workspace";
import { assertAndConsumeQuota, QuotaError } from "@/lib/usage";
import { getPlanOrFree } from "@/lib/plans";
import { enrichVideoSummaryPrompt } from "@/lib/videoContext";
import { detectQuickToolFromText, toolIntentLabel } from "@/lib/intentTools";
import type { ChatMessage } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StoredAttachment {
  url: string;
  filename: string;
  mimeType: string;
}

type StreamEvent =
  | { type: "status"; key: string; sessionId: string; detail?: string }
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

  // 퀵툴 미선택 시 문장 의도로 자동 라우팅 (예: "ppt 만들어줘" → 실제 .pptx 생성)
  const autoDetectedTool = !quickToolId && text ? detectQuickToolFromText(text) : null;
  if (autoDetectedTool) {
    quickToolId = autoDetectedTool;
  }

  try {
    await assertAndConsumeQuota(userId, quickToolId, {
      isNewSession: !sessionId,
    });
  } catch (err) {
    if (err instanceof QuotaError) {
      return NextResponse.json({ error: err.message, code: "QUOTA" }, { status: 402 });
    }
    throw err;
  }

  // 요금제 → 모델 티어 (free=standard, pro=priority, professional=top)
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const modelTier = getPlanOrFree(settings?.plan).modelTier;

  let chatSession;
  if (sessionId) {
    // 공유 워크스페이스 세션이면 멤버 누구나 이어서 대화할 수 있다.
    chatSession = await prisma.chatSession.findFirst({
      where: { id: sessionId, ...(await itemAccessWhere(userId)) },
    });
    if (!chatSession) {
      return NextResponse.json({ error: "대화를 찾을 수 없습니다." }, { status: 404 });
    }
  } else {
    let scope;
    try {
      scope = await resolveScope(request, userId);
    } catch (err) {
      if (err instanceof WorkspaceError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }
    chatSession = await prisma.chatSession.create({
      data: { userId, workspaceId: scope.workspaceId },
    });
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
          send({
            type: "status",
            key: "status.quicktool.generating",
            sessionId: resolvedSessionId,
            detail: autoDetectedTool
              ? `자동 감지 · ${toolIntentLabel(quickToolId)}`
              : toolIntentLabel(quickToolId),
          });

          const quickTool = getTool(quickToolId);
          // 첨부 파일을 오디오 / 이미지·문서 파트로 분리 (mixed·url·image 도구 지원)
          const audioFile = inlineFiles.find((f) => f.mimeType.startsWith("audio/"));
          const imageLike = inlineFiles.filter(
            (f) =>
              f.mimeType.startsWith("image/") ||
              f.mimeType.startsWith("video/") ||
              f.mimeType === "application/pdf" ||
              f.mimeType.startsWith("text/"),
          );
          const useMixed =
            quickTool?.inputType === "mixed" ||
            quickTool?.inputType === "url" ||
            quickTool?.inputType === "image" ||
            quickTool?.inputType === "audio";

          // 영상 요약: YouTube oEmbed 메타 보강
          let toolText = text;
          if (quickToolId === "video-summary") {
            send({
              type: "status",
              key: "status.quicktool.generating",
              sessionId: resolvedSessionId,
            });
            const enriched = await enrichVideoSummaryPrompt(text);
            toolText = enriched.enrichedText;
          }

          const result = await runToolGeneration({
            toolId: quickToolId,
            text: toolText,
            userId,
            modelTier,
            audio:
              quickTool?.inputType === "audio"
                ? inlineFiles[0]
                : useMixed
                  ? audioFile
                  : undefined,
            images:
              quickTool?.inputType === "image"
                ? inlineFiles
                : useMixed
                  ? imageLike.length
                    ? imageLike
                    : undefined
                  : undefined,
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
            if (result.file) {
              fileUrl = result.file.url;
              fileName = result.file.filename;
            }
          } else if (result.outputType === "structured") {
            replyText = `${result.tool.short} 초안을 완성했어요. 아래에서 바로 확인하고 편집할 수 있어요.`;
            resultData = result.resultData;
            structuredKind = result.structuredKind;
          } else if (result.outputType === "pptx") {
            replyText =
              "PPT 파일(.pptx)을 만들었어요. 아래에서 미리보고 다운로드할 수 있어요.";
            resultData = result.resultData;
            fileUrl = result.file.url;
            fileName = result.file.filename;
          } else if (result.outputType === "xlsx") {
            replyText =
              "엑셀 파일(.xlsx)을 만들었어요. 아래에서 확인하고 다운로드하세요.";
            resultData = result.resultData;
            fileUrl = result.file.url;
            fileName = result.file.filename;
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
          // ── 백엔드 라우트: 분류 → 생성 → (티어별) 정밀 검증 ──
          send({
            type: "status",
            key: "status.route.start",
            sessionId: resolvedSessionId,
            detail: modelTier,
          });

          const history = await prisma.chatHistory.findMany({
            where: { sessionId: resolvedSessionId },
            orderBy: { createdAt: "asc" },
          });
          const messages: ChatMessage[] = history.map((m, i) => ({
            role: m.role === "model" ? "model" : "user",
            text: m.text,
            files: i === history.length - 1 && inlineFiles.length ? inlineFiles : undefined,
          }));

          const result = await runBackendRoute({
            text,
            hasFiles: inlineFiles.length > 0,
            messages,
            modelTier,
            onStage: (e) => {
              send({
                type: "status",
                key: e.key,
                sessionId: resolvedSessionId,
                detail: [e.agentId, e.model, e.detail].filter(Boolean).join(" · "),
              });
            },
            onAttempt: (info) => {
              send({
                type: "status",
                key: "status.route.generate.try",
                sessionId: resolvedSessionId,
                detail: `${info.stage} · ${info.agentId} · ${info.provider}/${info.model}`,
              });
            },
          });

          const assistantRow = await prisma.chatHistory.create({
            data: {
              sessionId: resolvedSessionId,
              role: "model",
              text: result.text,
              agentId: `route:${result.agentId}${result.refined ? "+verify" : ""}`,
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
