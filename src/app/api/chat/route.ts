import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { runBackendRoute } from "@/lib/backendRoute";
import { runAgentRoute } from "@/lib/agentRoute";
import { runToolGeneration } from "@/lib/toolGeneration";
import { getTool } from "@/lib/tools";
import { friendlyError } from "@/lib/errors";
import { itemAccessWhere, resolveScope, WorkspaceError } from "@/lib/workspace";
import { assertAndConsumeQuota, refundQuota, QuotaError, type QuotaConsumption } from "@/lib/usage";
import { getPlanOrFree } from "@/lib/plans";
import { enrichVideoSummaryPrompt } from "@/lib/videoContext";
import { detectQuickToolFromText, toolIntentLabel } from "@/lib/intentTools";
import { needsToolOrchestration } from "@/lib/toolOrchestration";
import type { ChatMessage } from "@/lib/gemini";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB, MAX_CHAT_FILES } from "@/lib/constants";
import { buildZeffRuntimeInstruction } from "@/lib/zeffContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StoredAttachment {
  url: string;
  filename: string;
  mimeType: string;
}

type StreamEvent =
  | { type: "status"; key: string; sessionId: string; detail?: string }
  | { type: "delta"; sessionId: string; text: string }
  | { type: "done"; sessionId: string; message: Record<string, unknown>; interrupted?: boolean }
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
  let regenerate = false;
  let editMessageId: string | null = null;
  const uploads: File[] = [];

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    text = String(form.get("text") ?? "").trim();
    sessionId = (form.get("sessionId") as string) || null;
    quickToolId = (form.get("quickToolId") as string) || null;
    regenerate = form.get("regenerate") === "1";
    editMessageId = (form.get("editMessageId") as string) || null;
    for (const entry of form.getAll("files")) {
      if (entry instanceof File) uploads.push(entry);
    }
    if (uploads.length > MAX_CHAT_FILES) {
      return NextResponse.json(
        { error: `첨부는 한 번에 최대 ${MAX_CHAT_FILES}개까지 가능합니다.` },
        { status: 400 },
      );
    }
    const oversized = uploads.find((f) => f.size > MAX_UPLOAD_BYTES);
    if (oversized) {
      return NextResponse.json(
        { error: `파일이 너무 큽니다 (최대 ${MAX_UPLOAD_MB}MB): ${oversized.name}` },
        { status: 400 },
      );
    }
  } else {
    const body = await request.json().catch(() => ({}));
    text = typeof body?.text === "string" ? body.text.trim() : "";
    sessionId = typeof body?.sessionId === "string" ? body.sessionId : null;
    quickToolId = typeof body?.quickToolId === "string" ? body.quickToolId : null;
    regenerate = body?.regenerate === true;
    editMessageId = typeof body?.editMessageId === "string" ? body.editMessageId : null;
  }

  // 재생성: 새 텍스트 없이 세션의 마지막 사용자 메시지를 그대로 재사용한다(아래에서 채움).
  // 편집: 수정된 텍스트가 반드시 있어야 한다.
  if (!regenerate && !editMessageId && !text && uploads.length === 0) {
    return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
  }
  if (editMessageId && !text) {
    return NextResponse.json({ error: "수정할 내용을 입력해 주세요." }, { status: 400 });
  }
  if ((regenerate || editMessageId) && !sessionId) {
    return NextResponse.json({ error: "대화를 찾을 수 없습니다." }, { status: 404 });
  }

  // 퀵툴 미선택 시 문장 의도로 자동 라우팅 (예: "ppt 만들어줘" → 실제 .pptx 생성)
  // 조사+생성 등 오케스트레이션이 필요한 복합 요청은 퀵툴 자동감지를 건너뛰고
  // 백엔드 라우트 도구 루프로 보낸다. 단순 "PPT 만들어줘"는 기존처럼 퀵툴 직행.
  // (+) 메뉴의 에이전트 항목은 숨겼지만, quickToolId=agent 강제 모드는 계속 지원.
  const autoDetectedTool = !quickToolId && text ? detectQuickToolFromText(text) : null;
  if (autoDetectedTool && !(text && needsToolOrchestration(text))) {
    quickToolId = autoDetectedTool;
  }

  // 전역 AI 킬스위치 · 일일 한도 · 사용자 차단 · 쿼터 · 설정 병렬
  const { isAiGloballyEnabled, reserveAiDailySlot, refundAiDailySlot } = await import(
    "@/lib/aiControl"
  );
  const { touchUserActivity } = await import("@/lib/activity");
  let modelTier: "standard" | "priority" | "top" = "standard";
  let userLanguage: string | null = null;
  let quota: QuotaConsumption | null = null;
  let dailySlot: { periodKey: string } | null = null;

  // 생성이 시작되기 전에 예약해둔(쿼터·전역 일일 한도) 자리를 되돌린다 —
  // 생성이 실패로 끝났거나, 예약만 하고 실제로 진행하지 못한 모든 경로에서 호출한다.
  async function releaseReservations() {
    if (quota?.consumed) {
      await refundQuota(userId, quota.consumed.feature, quota.consumed.periodKey).catch((e) =>
        console.warn("[chat route] quota refund failed:", e),
      );
    }
    if (dailySlot) {
      await refundAiDailySlot(dailySlot.periodKey).catch((e) =>
        console.warn("[chat route] daily slot refund failed:", e),
      );
    }
  }

  try {
    const [aiOn, settings, , reservedSlot] = await Promise.all([
      isAiGloballyEnabled(),
      prisma.userSettings.findUnique({ where: { userId } }),
      touchUserActivity(userId),
      reserveAiDailySlot(),
    ]);
    dailySlot = reservedSlot;
    if (!aiOn) {
      await releaseReservations();
      return NextResponse.json(
        { error: "AI 기능이 일시적으로 비활성화되어 있습니다. 잠시 후 다시 시도해 주세요." },
        { status: 503 },
      );
    }
    if (settings?.aiDisabled) {
      await releaseReservations();
      return NextResponse.json(
        { error: "이 계정은 AI 이용이 제한되어 있습니다. 지원 센터로 문의해 주세요." },
        { status: 403 },
      );
    }
    modelTier = getPlanOrFree(settings?.plan).modelTier;
    userLanguage = settings?.language ?? null;
    quota = await assertAndConsumeQuota(userId, quickToolId, {
      isNewSession: !sessionId,
    });
  } catch (err) {
    await releaseReservations();
    if (err instanceof QuotaError) {
      return NextResponse.json({ error: err.message, code: "QUOTA" }, { status: 402 });
    }
    if (err instanceof Error && (err as Error & { code?: string }).code === "AI_DAILY_CAP") {
      return NextResponse.json({ error: err.message, code: "AI_DAILY_CAP" }, { status: 429 });
    }
    throw err;
  }

  const isNewSession = !sessionId;
  let chatSession;
  if (sessionId) {
    // 공유 워크스페이스 세션이면 멤버 누구나 이어서 대화할 수 있다.
    chatSession = await prisma.chatSession.findFirst({
      where: { id: sessionId, ...(await itemAccessWhere(userId)) },
    });
    if (!chatSession) {
      await releaseReservations();
      return NextResponse.json({ error: "대화를 찾을 수 없습니다." }, { status: 404 });
    }
  } else {
    let scope;
    try {
      scope = await resolveScope(request, userId);
    } catch (err) {
      await releaseReservations();
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

  let storedAttachments: StoredAttachment[] = [];
  let inlineFiles: { data: string; mimeType: string }[] = [];
  try {
    if (regenerate) {
      // 재생성: 새 사용자 메시지 없이, 마지막 사용자 메시지를 그대로 재사용해
      // 마지막 assistant 응답만 지우고 다시 생성한다.
      const lastUser = await prisma.chatHistory.findFirst({
        where: { sessionId: resolvedSessionId, role: "user" },
        orderBy: { createdAt: "desc" },
      });
      if (!lastUser) {
        await releaseReservations();
        return NextResponse.json({ error: "재생성할 대화가 없습니다." }, { status: 400 });
      }
      text = lastUser.text;
      const lastAssistant = await prisma.chatHistory.findFirst({
        where: { sessionId: resolvedSessionId, role: "model" },
        orderBy: { createdAt: "desc" },
      });
      if (lastAssistant) {
        await prisma.chatHistory.delete({ where: { id: lastAssistant.id } });
      }
      await prisma.chatSession.update({
        where: { id: resolvedSessionId },
        data: { updatedAt: new Date() },
      });
    } else if (editMessageId) {
      // 편집: 해당 사용자 메시지 이후 생긴 모든 기록을 지우고, 그 메시지 자체를
      // 수정된 텍스트로 교체한다 — 이후 대화는 이 지점부터 새로 갈라져 나간다.
      const target = await prisma.chatHistory.findFirst({
        where: { id: editMessageId, sessionId: resolvedSessionId, role: "user" },
      });
      if (!target) {
        await releaseReservations();
        return NextResponse.json({ error: "수정할 메시지를 찾을 수 없습니다." }, { status: 404 });
      }
      await prisma.chatHistory.deleteMany({
        where: { sessionId: resolvedSessionId, createdAt: { gt: target.createdAt } },
      });
      await prisma.chatHistory.update({ where: { id: target.id }, data: { text } });
      await prisma.chatSession.update({
        where: { id: resolvedSessionId },
        data: { updatedAt: new Date() },
      });
    } else {
      // 첨부 업로드 병렬화 (순차 put 대비 체감 대폭 단축)
      const uploaded = await Promise.all(
        uploads.map(async (file, i) => {
          const buf = Buffer.from(await file.arrayBuffer());
          const mimeType = file.type || "application/octet-stream";
          const blob = await put(
            `chat/${userId}/${resolvedSessionId}/${Date.now()}-${i}-${file.name}`,
            buf,
            { access: "public", contentType: mimeType, addRandomSuffix: true },
          );
          return {
            stored: {
              url: blob.url,
              filename: file.name,
              mimeType,
            } satisfies StoredAttachment,
            inline: { data: buf.toString("base64"), mimeType },
          };
        }),
      );
      storedAttachments = uploaded.map((u) => u.stored);
      inlineFiles = uploaded.map((u) => u.inline);

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
          // 빈 제목은 첫 메시지로 갱신한다. 번역된 placeholder 문자열(예: "New chat")을
          // 데이터로 저장하지 않으므로 언어에 상관없이 항상 정확히 동작한다 —
          // 사이드바는 이미 title이 비어 있으면 t("sidebar.newChat")으로 표시한다.
          ...(!chatSession.title ? { title: text.slice(0, 40) || null } : {}),
        },
      });
    }
  } catch (err) {
    await releaseReservations();
    if (isNewSession) {
      await prisma.chatSession.delete({ where: { id: resolvedSessionId } }).catch(() => {});
    }
    console.error("[chat route] pre-stream setup failed:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }

  const encoder = new TextEncoder();
  let streamCancelled = false;
  const stream = new ReadableStream({
    async start(controller) {
      // 클라이언트가 연결을 끊은(중단 버튼 등) 뒤에도 이후 이벤트가 계속 enqueue될 수
      // 있는데, 그때 controller는 이미 닫힌 상태라 예외가 난다 — 조용히 무시한다
      // (아무도 안 듣고 있으니 실패해도 상관없다). 실제 취소 전파는 request.signal이 한다.
      function send(event: StreamEvent) {
        if (streamCancelled) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        } catch {
          /* 클라이언트가 이미 연결을 끊음 */
        }
      }

      try {
        if (quickToolId === "agent") {
          // ── 강제 도구 모드: 도구를 스스로 골라 연쇄 호출 ──
          // (+) 메뉴에는 노출하지 않지만 API/레거시 칩은 계속 동작한다.
          send({
            type: "status",
            key: "status.route.start",
            sessionId: resolvedSessionId,
            detail: "agent",
          });

          const AGENT_HISTORY_LIMIT = 16;
          const agentHistory = await prisma.chatHistory.findMany({
            where: { sessionId: resolvedSessionId },
            orderBy: { createdAt: "desc" },
            take: AGENT_HISTORY_LIMIT,
            select: { role: true, text: true },
          });
          agentHistory.reverse();
          const agentMessages: ChatMessage[] = agentHistory.map((m) => ({
            role: m.role === "model" ? "model" : "user",
            text: m.text,
          }));

          const agentResult = await runAgentRoute({
            text,
            messages: agentMessages,
            modelTier,
            userId,
            workspaceId: chatSession.workspaceId ?? null,
            signal: request.signal,
            onDelta: (delta) =>
              send({ type: "delta", sessionId: resolvedSessionId, text: delta }),
            onStage: (detail) =>
              send({
                type: "status",
                key: "status.route.generate.try",
                sessionId: resolvedSessionId,
                detail,
              }),
            onAttempt: (info) =>
              send({
                type: "status",
                key: "status.route.generate.try",
                sessionId: resolvedSessionId,
                detail: `${info.provider}/${info.model}`,
              }),
          });

          const art = agentResult.artifact;
          const assistantRow = await prisma.chatHistory.create({
            data: {
              sessionId: resolvedSessionId,
              role: "model",
              text: agentResult.text,
              agentId: `agent:${agentResult.toolsUsed.join(",") || "none"}`,
              provider: agentResult.provider,
              modelName: agentResult.model,
              attempts: agentResult.attempts,
              outputType: art?.outputType,
              structuredKind: art?.structuredKind,
              resultData: art?.resultData,
              fileUrl: art?.fileUrl,
              fileName: art?.fileName,
            },
          });
          await prisma.chatSession.update({
            where: { id: resolvedSessionId },
            data: { updatedAt: new Date() },
          });

          send({
            type: "done",
            sessionId: resolvedSessionId,
            message: assistantRow,
            interrupted: agentResult.interrupted,
          });
        } else if (quickToolId) {
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

          // 영상 URL 도구: YouTube oEmbed 메타 보강
          let toolText = text;
          if (
            quickToolId === "video-summary" ||
            quickToolId === "lecture" ||
            quickToolId === "lecture-chat"
          ) {
            send({
              type: "status",
              key: "status.quicktool.generating",
              sessionId: resolvedSessionId,
            });
            const enriched = await enrichVideoSummaryPrompt(text);
            toolText = enriched.enrichedText;
          }

          // 대화 맥락 자동 이어받기: 최근 대화를 참고 컨텍스트로 덧붙이고,
          // 요청이 이를 가리키면 반영·아니면 무시하도록 모델이 스스로 판단하게 한다.
          if (text) {
            const prior = await prisma.chatHistory.findMany({
              where: { sessionId: resolvedSessionId },
              orderBy: { createdAt: "desc" },
              take: 8,
              select: { role: true, text: true },
            });
            prior.reverse();
            // 방금 저장된 현재 사용자 메시지는 제외
            if (prior.length && prior[prior.length - 1]?.text === text) prior.pop();
            const ctx = prior
              .filter((m) => m.text?.trim())
              .map((m) => `${m.role === "model" ? "AI" : "사용자"}: ${m.text.slice(0, 500)}`)
              .join("\n")
              .slice(-2000);
            if (ctx) {
              toolText =
                `[최근 대화 맥락 — 이번 요청이 이 내용을 가리키거나 이어지는 경우에만 참고하고, 무관하면 완전히 무시하세요]\n${ctx}\n\n[요청]\n${toolText}`;
            }
          }

          const result = await runToolGeneration({
            toolId: quickToolId,
            text: toolText,
            userId,
            modelTier,
            audio:
              quickTool?.inputType === "audio"
                ? audioFile ?? inlineFiles.find((f) => f.mimeType.startsWith("audio/"))
                : useMixed
                  ? audioFile
                  : undefined,
            images:
              quickTool?.inputType === "image"
                ? imageLike.length
                  ? imageLike
                  : inlineFiles.filter((f) => f.mimeType.startsWith("image/"))
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
          } else if (result.outputType === "image") {
            replyText = "이미지를 생성했어요. 아래에서 확인하고 다운로드할 수 있어요.";
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

          // 최근 N턴만 로드 — 토큰 증가 없이 컨텍스트 윈도우·DB I/O 축소
          const HISTORY_LIMIT = 16;
          const history = await prisma.chatHistory.findMany({
            where: { sessionId: resolvedSessionId },
            orderBy: { createdAt: "desc" },
            take: HISTORY_LIMIT,
            select: { role: true, text: true, createdAt: true },
          });
          history.reverse();
          const messages: ChatMessage[] = history.map((m, i) => ({
            role: m.role === "model" ? "model" : "user",
            text: m.text,
            files: i === history.length - 1 && inlineFiles.length ? inlineFiles : undefined,
          }));

          const extraSystemInstruction = await buildZeffRuntimeInstruction({
            userId,
            workspaceId: chatSession.workspaceId ?? null,
            query: text,
            language: userLanguage,
          });

          const result = await runBackendRoute({
            text,
            hasFiles: inlineFiles.length > 0,
            messages,
            modelTier,
            userId,
            workspaceId: chatSession.workspaceId ?? null,
            extraSystemInstruction,
            signal: request.signal,
            onDelta: (delta) => {
              send({ type: "delta", sessionId: resolvedSessionId, text: delta });
            },
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

          const art = result.artifact;
          const toolsSuffix = result.toolsUsed?.length
            ? `+tools:${result.toolsUsed.join(",")}`
            : "";
          const assistantRow = await prisma.chatHistory.create({
            data: {
              sessionId: resolvedSessionId,
              role: "model",
              text: result.text,
              agentId: `route:${result.agentId}${result.refined ? "+verify" : ""}${toolsSuffix}`,
              provider: result.provider,
              modelName: result.model,
              attempts: result.attempts,
              outputType: art?.outputType,
              structuredKind: art?.structuredKind,
              resultData: art?.resultData,
              fileUrl: art?.fileUrl,
              fileName: art?.fileName,
            },
          });
          await prisma.chatSession.update({
            where: { id: resolvedSessionId },
            data: { updatedAt: new Date() },
          });

          send({
            type: "done",
            sessionId: resolvedSessionId,
            message: assistantRow,
            interrupted: result.interrupted,
          });
        }
      } catch (err) {
        console.error("chat stream error:", err);
        await releaseReservations();
        send({ type: "error", sessionId: resolvedSessionId, message: friendlyError(err) });
      } finally {
        try {
          controller.close();
        } catch {
          /* 이미 취소되어 닫혀 있음 */
        }
      }
    },
    cancel() {
      // 클라이언트가 연결을 끊음(중단 버튼 등) — request.signal이 하위 fetch/SDK 호출까지
      // 전파해 실제 생성을 멈춘다. 여기서는 이후 enqueue를 막기만 하면 된다.
      streamCancelled = true;
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
}
