import { put } from "@vercel/blob";
import { generateWithFallback, type AttemptInfo, type FallbackResult } from "./ai";
import type { ModelTier } from "./models";
import { getTool, type ToolDef } from "./tools";
import { parseDeck, buildPptxBase64 } from "./pptx";
import { parseWorkbook, buildXlsxBase64 } from "./xlsx";
import { parseStructured, type StructuredKind } from "./structured";
import type { Deck, Workbook } from "./fileTypes";
import { exportHeader } from "./videoContext";
import { stripHanja } from "./textSanitize";
import { verifyMathSolve, stripVerifyBlock, extractFinalAnswer } from "./mathVerify";

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export interface ToolGenerationInput {
  toolId: string;
  text?: string;
  audio?: { data: string; mimeType: string };
  images?: { data: string; mimeType: string }[];
  userId: string;
  modelTier?: ModelTier;
  onAttempt?: (info: AttemptInfo) => void;
  onUploadStart?: () => void;
}

interface Meta {
  provider: FallbackResult["provider"];
  model: FallbackResult["model"];
  attempts: number;
}

export type ToolGenerationResult =
  | {
      tool: ToolDef;
      outputType: "markdown";
      text: string;
      meta: Meta;
      /** .md 등 텍스트 파일 다운로드용 */
      file?: { url: string; filename: string; mimeType: string };
    }
  | {
      tool: ToolDef;
      outputType: "structured";
      structuredKind: StructuredKind;
      data: unknown;
      resultData: string;
      meta: Meta;
    }
  | {
      tool: ToolDef;
      outputType: "pptx" | "xlsx";
      preview: Deck | Workbook;
      resultData: string;
      file: { url: string; filename: string; mimeType: string };
      meta: Meta;
    };

const MD_EXPORT_TOOLS = new Set(["note-a4", "video-summary", "exam-maker", "word-doc", "math-solve"]);

/**
 * math-solve 응답을 AI의 "검산" 서술만 믿지 않고 expr-eval로 실제 재계산해 확인한다.
 * 실패하면 원인을 알려주며 딱 한 번만 재생성하고, 그래도 안 맞으면 원본을 보여주되
 * 눈에 띄는 경고를 붙인다 — 틀린 답을 조용히 맞는 것처럼 보여주지 않기 위함이다.
 */
async function verifyAndAnnotateMathSolve(
  raw: string,
  meta: Meta,
  tool: ToolDef,
  input: ToolGenerationInput,
): Promise<{ text: string; meta: Meta }> {
  let finalRaw = raw;
  let finalMeta = meta;
  let verify = verifyMathSolve(finalRaw);

  if (verify && verify.failed.length > 0) {
    try {
      const retryNote = [
        "[자동 검산 실패 - 아래 계산이 문제와 안 맞으니 처음부터 다시 정확히 풀어라]",
        ...verify.failed.map(
          (f) =>
            `- ${f.expr} 는 ${f.expected}가 나와야 하는데 실제로는 ${f.actual ?? "계산 불가"}로 계산됐다.`,
        ),
      ].join("\n");
      const retry = await generateWithFallback({
        tool,
        text: [input.text ?? "", retryNote].filter(Boolean).join("\n\n"),
        audio: input.audio,
        images: input.images,
        modelTier: input.modelTier,
      });
      const retryRaw = stripHanja(retry.text);
      const retryVerify = verifyMathSolve(retryRaw);
      if (!retryVerify || retryVerify.failed.length === 0) {
        finalRaw = retryRaw;
        verify = retryVerify;
        finalMeta = { provider: retry.provider, model: retry.model, attempts: meta.attempts + retry.attempts };
      }
    } catch (err) {
      console.warn("[toolGeneration] math-solve 검산 재시도 실패", err);
    }
  }

  if (verify && verify.failed.length > 0) {
    return {
      text: [
        "> ⚠️ 자동 검산에서 값이 맞지 않는 부분을 발견했어요. 아래 풀이를 참고하되 직접 한 번 더 확인해 주세요.",
        "",
        stripVerifyBlock(finalRaw),
      ].join("\n"),
      meta: finalMeta,
    };
  }

  // 산수 검산 자체가 불가능한 문제(증명·기하 등)는, 같은 AI의 자기 검산으로는 개념
  // 자체를 잘못 세운 오류를 못 잡는다 — 다른 제공자로 독립적으로 한 번 더 풀게 해서
  // 최종 답이 같은지 대조한다.
  if (verify === null) {
    try {
      const crossCheck = await generateWithFallback({
        tool,
        text: input.text,
        audio: input.audio,
        images: input.images,
        modelTier: input.modelTier,
        excludeProviders: [finalMeta.provider],
      });
      const crossRaw = stripHanja(crossCheck.text);
      const primaryAnswer = extractFinalAnswer(finalRaw);
      const crossAnswer = extractFinalAnswer(crossRaw);
      if (primaryAnswer && crossAnswer && primaryAnswer !== crossAnswer) {
        return {
          text: [
            "> ℹ️ 이 문제는 자동 계산 검증이 불가능해 다른 AI로 한 번 더 독립적으로 풀어봤는데, 최종 답이 다르게 나왔어요. 아래 풀이와 비교해서 확인해 주세요.",
            `> 다른 AI가 낸 답: ${crossAnswer}`,
            "",
            stripVerifyBlock(finalRaw),
          ].join("\n"),
          meta: finalMeta,
        };
      }
    } catch (err) {
      console.warn("[toolGeneration] math-solve 교차 검증 실패", err);
    }
  }

  return { text: stripVerifyBlock(finalRaw), meta: finalMeta };
}

/** /api/generate가 하던 파싱→빌드→업로드 로직을 히스토리 저장 없이 재사용 가능한 형태로 뽑아낸 것. */
export async function runToolGeneration(
  input: ToolGenerationInput
): Promise<ToolGenerationResult> {
  const tool = getTool(input.toolId);
  if (!tool) throw new Error("알 수 없는 도구입니다.");

  const hasText = !!(input.text && input.text.trim());
  const hasImages = !!(input.images && input.images.length > 0);
  const hasAudio = !!input.audio;

  if (tool.inputType === "audio") {
    if (!hasAudio) throw new Error("오디오 파일을 첨부해 주세요.");
  } else if (tool.inputType === "image") {
    if (!hasImages) throw new Error("이미지 파일을 첨부해 주세요.");
  } else if (tool.inputType === "mixed" || tool.inputType === "url") {
    if (!hasText && !hasImages && !hasAudio) {
      throw new Error("URL·텍스트를 입력하거나 파일을 첨부해 주세요.");
    }
  } else if (!hasText && !hasImages) {
    throw new Error("요청할 내용을 입력해 주세요.");
  }

  const { text: rawText, provider, model, attempts } = await generateWithFallback({
    tool,
    text: input.text,
    audio: input.audio,
    images: input.images,
    modelTier: input.modelTier,
    onAttempt: input.onAttempt,
  });
  if (!rawText) throw new Error("AI가 빈 응답을 반환했습니다. 다시 시도해 주세요.");
  // 프롬프트로 한자 금지를 지시해도 종종 새어나와, 파싱 전에 결정적으로 제거한다.
  let raw = stripHanja(rawText);
  let meta: Meta = { provider, model, attempts };

  if (tool.id === "math-solve") {
    const verified = await verifyAndAnnotateMathSolve(raw, meta, tool, input);
    raw = verified.text;
    meta = verified.meta;
  }

  if (tool.outputType === "structured" && tool.structuredKind) {
    const structured = parseStructured(tool.structuredKind, raw);
    return {
      tool,
      outputType: "structured",
      structuredKind: tool.structuredKind,
      data: structured.data,
      resultData: JSON.stringify(structured.data),
      meta,
    };
  }

  if (tool.outputType === "pptx") {
    let deck;
    try {
      deck = parseDeck(raw);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "PPT 파싱 실패";
      console.error("[toolGeneration] pptx parse", msg, raw.slice(0, 400));
      throw new Error(msg);
    }
    input.onUploadStart?.();
    const base64 = await buildPptxBase64(deck);
    const safeName = (deck.title || tool.fileBaseName)
      .replace(/[\\/:*?"<>|]+/g, "")
      .slice(0, 40) || tool.fileBaseName;
    const blob = await put(
      `history/${input.userId}/${tool.fileBaseName}-${Date.now()}.pptx`,
      Buffer.from(base64, "base64"),
      { access: "public", contentType: PPTX_MIME },
    );
    return {
      tool,
      outputType: "pptx",
      preview: deck,
      resultData: JSON.stringify(deck),
      file: {
        url: blob.url,
        filename: `${safeName}.pptx`,
        mimeType: PPTX_MIME,
      },
      meta,
    };
  }

  if (tool.outputType === "xlsx") {
    let wb;
    try {
      wb = parseWorkbook(raw);
    } catch (err) {
      console.error("[toolGeneration] xlsx parse", err);
      throw new Error("엑셀 데이터 파싱에 실패했습니다. 다시 시도해 주세요.");
    }
    if (!wb.sheets.length) {
      throw new Error("엑셀 시트가 비어 있습니다. 요청을 더 구체적으로 적어 주세요.");
    }
    input.onUploadStart?.();
    const base64 = await buildXlsxBase64(wb);
    const safeName = (wb.title || tool.fileBaseName)
      .replace(/[\\/:*?"<>|]+/g, "")
      .slice(0, 40) || tool.fileBaseName;
    const blob = await put(
      `history/${input.userId}/${tool.fileBaseName}-${Date.now()}.xlsx`,
      Buffer.from(base64, "base64"),
      { access: "public", contentType: XLSX_MIME },
    );
    return {
      tool,
      outputType: "xlsx",
      preview: wb,
      resultData: JSON.stringify(wb),
      file: {
        url: blob.url,
        filename: `${safeName}.xlsx`,
        mimeType: XLSX_MIME,
      },
      meta,
    };
  }

  // 노트·영상 요약·시험지 등은 .md 파일로 Blob 저장 (다운로드 링크)
  if (MD_EXPORT_TOOLS.has(tool.id)) {
    try {
      input.onUploadStart?.();
      const kind =
        tool.id === "note-a4"
          ? "note"
          : tool.id === "video-summary"
            ? "video"
            : tool.id === "exam-maker"
              ? "exam"
              : "generic";
      const body = `${exportHeader(kind)}\n${raw.trim()}\n`;
      const blob = await put(
        `exports/${input.userId}/${tool.fileBaseName}-${Date.now()}.md`,
        body,
        { access: "public", contentType: "text/markdown; charset=utf-8" },
      );
      return {
        tool,
        outputType: "markdown",
        text: raw,
        meta,
        file: {
          url: blob.url,
          filename: `${tool.fileBaseName}.md`,
          mimeType: "text/markdown",
        },
      };
    } catch (err) {
      console.error("[markdown export upload]", err);
      // 업로드 실패해도 본문 응답은 유지
    }
  }

  return { tool, outputType: "markdown", text: raw, meta };
}
