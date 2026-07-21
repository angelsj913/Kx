import { put } from "@vercel/blob";
import sharp from "sharp";
import { generateWithFallback, type AttemptInfo, type FallbackResult } from "./ai";
import { validateDeck, validateWorkbook } from "./pptValidate";
import { buildDocxBase64, parseMarkdownSections, DOCX_MIME } from "./docx";
import { PPT_OUTLINE_INSTRUCTION, PPT_FILL_INSTRUCTION_PREFIX } from "./prompts/registry";
import { geminiGenerateForTool, geminiGenerateImage, SafetyRefusalError } from "./gemini";
import { getOpenRouterImageModels, openRouterGenerateImage } from "./openaiCompat";
import { noteProviderFailure } from "./providerHealth";
import type { ModelTier } from "./models";
import { getTool, type ToolDef } from "./tools";
import { parseDeck, buildPptxBase64 } from "./pptx";
import { parseWorkbook, buildXlsxBase64 } from "./xlsx";
import {
  parseStructured,
  parsePracticeSet,
  isEmptyMathGraph,
  type StructuredKind,
  type PracticeSet,
  type MathGraph,
} from "./structured";
import type { Deck, Workbook } from "./fileTypes";
import { exportHeader } from "./videoContext";
import { stripHanja } from "./textSanitize";
import {
  verifyMathSolve,
  stripVerifyBlock,
  extractFinalAnswer,
  verifyPracticeSetProblems,
} from "./mathVerify";

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
  provider: FallbackResult["provider"] | "local";
  model: FallbackResult["model"];
  attempts: number;
}

async function upscaleImage2x(data: string): Promise<string> {
  const image = sharp(Buffer.from(data, "base64")).rotate();
  const metadata = await image.metadata();
  const width = Math.min((metadata.width ?? 1024) * 2, 4096);
  const height = Math.min((metadata.height ?? 1024) * 2, 4096);
  return (await image.resize(width, height, { kernel: sharp.kernel.lanczos3 }).png().toBuffer()).toString(
    "base64",
  );
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
    }
  | {
      tool: ToolDef;
      outputType: "docx";
      text: string;
      file: { url: string; filename: string; mimeType: string };
      meta: Meta;
    }
  | {
      tool: ToolDef;
      outputType: "image";
      file: { url: string; filename: string; mimeType: string };
      meta: Meta;
    };

const MD_EXPORT_TOOLS = new Set([
  "note-a4",
  "video-summary",
  "exam-maker",
  "math-solve",
  "doc-translate",
]);

const MATH_SOLVE_MAX_RETRIES = 2;

/**
 * math-solve 응답을 AI의 "검산" 서술만 믿지 않고 expr-eval로 실제 재계산해 확인한다.
 * 실패하면 원인을 알려주며 최대 2번까지 재생성하고, 그래도 안 맞으면 원본을 보여주되
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

  for (let attempt = 0; verify && verify.failed.length > 0 && attempt < MATH_SOLVE_MAX_RETRIES; attempt++) {
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
      finalRaw = stripHanja(retry.text);
      verify = verifyMathSolve(finalRaw);
      finalMeta = {
        provider: retry.provider,
        model: retry.model,
        attempts: finalMeta.attempts + retry.attempts,
      };
    } catch (err) {
      console.warn("[toolGeneration] math-solve 검산 재시도 실패", err);
      break;
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
  // 최종 답이 같은지 대조한다. 둘이 갈리면 세 번째 제공자로 동점을 깬다.
  if (verify === null) {
    const hasBinaryInput = !!input.audio || !!(input.images && input.images.length > 0);
    if (hasBinaryInput) {
      // 이미지·오디오 입력은 멀티모달 후보가 사실상 Gemini 하나뿐이라, 그 제공자를
      // 제외하는 순간 교차검증 후보가 0개가 되어 매번 조용히 실패한다(console.warn만
      // 남고 사용자는 아무것도 모른 채 "검증됨"으로 보이는 결과를 받는다). 아예
      // 시도하지 않고 상태를 명확히 알린다.
      return {
        text: [
          "> ℹ️ 이 문제는 사진으로 입력돼 있어 독립적인 교차검증은 하지 않았어요. 계산 과정을 직접 한 번 더 확인해 주세요.",
          "",
          stripVerifyBlock(finalRaw),
        ].join("\n"),
        meta: finalMeta,
      };
    }
    try {
      const excluded =
        finalMeta.provider === "local" ? [] : [finalMeta.provider];
      const crossCheck = await generateWithFallback({
        tool,
        text: input.text,
        audio: input.audio,
        images: input.images,
        modelTier: input.modelTier,
        excludeProviders: excluded,
      });
      const crossRaw = stripHanja(crossCheck.text);
      const primaryAnswer = extractFinalAnswer(finalRaw);
      const crossAnswer = extractFinalAnswer(crossRaw);

      if (primaryAnswer && crossAnswer && primaryAnswer !== crossAnswer) {
        try {
          const tieBreak = await generateWithFallback({
            tool,
            text: input.text,
            audio: input.audio,
            images: input.images,
            modelTier: input.modelTier,
            excludeProviders: [...excluded, crossCheck.provider],
          });
          const tieRaw = stripHanja(tieBreak.text);
          const tieAnswer = extractFinalAnswer(tieRaw);

          if (tieAnswer && tieAnswer === crossAnswer) {
            // 2:1로 교차검증 쪽이 이겼다 — 그쪽을 최종 답으로 채택.
            return {
              text: stripVerifyBlock(crossRaw),
              meta: {
                provider: crossCheck.provider,
                model: crossCheck.model,
                attempts: finalMeta.attempts + crossCheck.attempts + tieBreak.attempts,
              },
            };
          }
          if (tieAnswer && tieAnswer === primaryAnswer) {
            // 2:1로 원래 답이 이겼다 — 경고 없이 그대로 채택.
            return { text: stripVerifyBlock(finalRaw), meta: finalMeta };
          }
          // 셋 다 다르면 하나를 고를 근거가 없으니 전부 보여주고 직접 확인하게 한다.
          return {
            text: [
              "> ⚠️ 이 문제는 자동 계산 검증이 불가능해 서로 다른 AI 3개로 독립적으로 풀어봤는데, 답이 모두 다르게 나왔어요. 아래 풀이를 참고하되 직접 꼭 확인해 주세요.",
              `> 1번째 AI 답: ${primaryAnswer}`,
              `> 2번째 AI 답: ${crossAnswer}`,
              `> 3번째 AI 답: ${tieAnswer ?? "(답 추출 실패)"}`,
              "",
              stripVerifyBlock(finalRaw),
            ].join("\n"),
            meta: finalMeta,
          };
        } catch (err) {
          console.warn("[toolGeneration] math-solve 동점 깨기 실패", err);
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
      }
    } catch (err) {
      console.warn("[toolGeneration] math-solve 교차 검증 실패", err);
    }
  }

  return { text: stripVerifyBlock(finalRaw), meta: finalMeta };
}

const PRACTICE_SET_MAX_RETRIES = 1;

/**
 * similar-problems(유사문제 생성) 응답 중 산술 검산 가능한 문항(verify 필드가 채워진
 * 것)만 expr-eval로 재계산해 확인한다. 실패 문항이 있으면 어떤 문항이 왜 틀렸는지
 * 알려주며 세트 전체를 최대 1번 재생성한다(부분 문항만 다시 만들면 세트 전체의
 * 난이도·구성 일관성이 깨지기 쉬워 세트 단위로 재생성). 그래도 안 맞으면 해당 문항의
 * 해설 앞에 경고를 붙여 그대로 보여준다 — math-solve와 같은 "틀린 답을 조용히 맞는
 * 것처럼 보여주지 않는다"는 원칙을 그대로 따른다.
 */
async function verifyAndAnnotatePracticeSet(
  raw: string,
  meta: Meta,
  tool: ToolDef,
  input: ToolGenerationInput,
): Promise<{ data: PracticeSet; meta: Meta }> {
  const parsed = await parseStructuredWithRetry(parsePracticeSet, raw, meta, tool, input);
  let finalMeta = parsed.meta;
  let data = parsed.data;
  let failed = verifyPracticeSetProblems(data.problems);

  for (let attempt = 0; failed.length > 0 && attempt < PRACTICE_SET_MAX_RETRIES; attempt++) {
    try {
      const retryNote = [
        "[자동 검산 실패 - 아래 문항의 정답 계산이 문제와 안 맞으니 세트 전체를 처음부터 다시 정확히 만들어라]",
        ...failed.map(
          (f) =>
            `- 문항 ${f.index + 1}: ${f.expr} 는 ${f.expected}가 나와야 하는데 실제로는 ${f.actual ?? "계산 불가"}로 계산됐다.`,
        ),
      ].join("\n");
      const retry = await generateWithFallback({
        tool,
        text: [input.text ?? "", retryNote].filter(Boolean).join("\n\n"),
        modelTier: input.modelTier,
      });
      const retryRaw = stripHanja(retry.text);
      data = parsePracticeSet(retryRaw);
      failed = verifyPracticeSetProblems(data.problems);
      finalMeta = {
        provider: retry.provider,
        model: retry.model,
        attempts: finalMeta.attempts + retry.attempts,
      };
    } catch (err) {
      console.warn("[toolGeneration] similar-problems 검산 재시도 실패", err);
      break;
    }
  }

  if (failed.length > 0) {
    const failedIndices = new Set(failed.map((f) => f.index));
    data = {
      ...data,
      problems: data.problems.map((p, i) =>
        failedIndices.has(i)
          ? {
              ...p,
              explanation: `⚠️ 자동 검산에서 이 문항의 계산이 맞지 않는 것으로 나왔어요. 직접 한 번 더 확인해 주세요.\n\n${p.explanation}`,
            }
          : p,
      ),
    };
  }

  return { data, meta: finalMeta };
}

const STRUCTURED_RETRY_NOTE =
  "[이전 응답이 유효한 JSON 형식이 아니었다. 설명이나 코드펜스 없이 순수 JSON 객체 하나만 다시 정확히 출력하라.]";

/**
 * 구조화 툴(JSON 출력) 파싱을 시도하고, 실패하면(또는 isEmpty가 참이면) 교정 지시를
 * 붙여 1회만 재생성 후 다시 파싱한다. 그래도 실패하면 pptx/xlsx와 같은 스타일의 명확한
 * 에러로 던진다 — 지금까지는 파싱 실패가 처리되지 않은 SyntaxError로 그대로 올라가
 * 사용자에게 의미 없는 일반 에러 문구만 보였다.
 */
async function parseStructuredWithRetry<T>(
  parse: (raw: string) => T,
  raw: string,
  meta: Meta,
  tool: ToolDef,
  input: ToolGenerationInput,
  isEmpty?: (data: T) => boolean,
): Promise<{ data: T; meta: Meta }> {
  function tryParse(candidate: string): T | null {
    try {
      const data = parse(candidate);
      if (isEmpty?.(data)) return null;
      return data;
    } catch {
      return null;
    }
  }

  let data = tryParse(raw);
  let finalMeta = meta;

  if (data === null) {
    try {
      const retry = await generateWithFallback({
        tool,
        text: [input.text ?? "", STRUCTURED_RETRY_NOTE].filter(Boolean).join("\n\n"),
        audio: input.audio,
        images: input.images,
        modelTier: input.modelTier,
      });
      const retryRaw = stripHanja(retry.text);
      data = tryParse(retryRaw);
      finalMeta = {
        provider: retry.provider,
        model: retry.model,
        attempts: finalMeta.attempts + retry.attempts,
      };
    } catch (err) {
      console.warn(`[toolGeneration] ${tool.id} 구조화 파싱 재시도 실패`, err);
    }
  }

  if (data === null) {
    throw new Error("AI가 예상한 형식으로 응답하지 않았어요. 다시 시도해 주세요.");
  }

  return { data, meta: finalMeta };
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

  if (tool.outputType === "image") {
    let data = "";
    let mimeType = "image/png";
    let model = "";
    if (tool.id === "image-upscale") {
      const source = input.images?.[0];
      if (!source) throw new Error("확대할 이미지를 첨부해 주세요.");
      data = await upscaleImage2x(source.data);
      mimeType = "image/png";
      model = "lanczos3-2x";
    } else {
      if (!hasText) throw new Error("이미지 설명을 입력해 주세요.");
      const prompt = input.text!.trim();
      try {
        // 이미지 생성은 Gemini를 먼저 사용하고, 빈 결과·일시 오류에서만 OpenRouter로 넘어간다.
        const img = await geminiGenerateImage({
          prompt,
          systemInstruction: tool.systemInstruction,
        });
        data = img.data;
        mimeType = img.mimeType;
        model = "gemini-2.5-flash-image";
      } catch (err) {
        if (err instanceof SafetyRefusalError) throw err;
        noteProviderFailure("gemini", err);
        const models = [
          process.env.OPENROUTER_IMAGE_MODEL || "bytedance-seed/seedream-4.5",
          ...(await getOpenRouterImageModels()),
        ];
        let lastError: unknown = err;
        for (const candidate of [...new Set(models)]) {
          try {
            const img = await openRouterGenerateImage({ prompt, model: candidate });
            data = img.data;
            mimeType = img.mimeType;
            model = img.model;
            lastError = null;
            break;
          } catch (fallbackError) {
            if (fallbackError instanceof SafetyRefusalError) throw fallbackError;
            noteProviderFailure("openrouter", fallbackError);
            lastError = fallbackError;
          }
        }
        if (lastError) throw lastError;
      }
      if (!data) throw new Error("이미지를 생성하지 못했습니다.");
      data = await upscaleImage2x(data);
      mimeType = "image/png";
      model = `${model}+lanczos3-2x`;
    }
    input.onUploadStart?.();
    const ext = mimeType.split("/")[1]?.split("+")[0] || "png";
    const blob = await put(
      `history/${input.userId}/${tool.fileBaseName}-${Date.now()}.${ext}`,
      Buffer.from(data, "base64"),
      { access: "public", contentType: mimeType, addRandomSuffix: true },
    );
    return {
      tool,
      outputType: "image",
      file: { url: blob.url, filename: `${tool.fileBaseName}.${ext}`, mimeType },
      meta: {
        provider: tool.id === "image-upscale" ? "local" : model.startsWith("gemini") ? "gemini" : "openrouter",
        model,
        attempts: 1,
      },
    };
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
  // 단, doc-translate는 일본어·중국어 등 정당한 CJK 번역 결과를 낼 수 있어 예외로 둔다.
  let raw = tool.id === "doc-translate" ? rawText : stripHanja(rawText);
  let meta: Meta = { provider, model, attempts };

  if (tool.id === "math-solve") {
    const verified = await verifyAndAnnotateMathSolve(raw, meta, tool, input);
    raw = verified.text;
    meta = verified.meta;
  }

  if (tool.id === "similar-problems") {
    const verified = await verifyAndAnnotatePracticeSet(raw, meta, tool, input);
    return {
      tool,
      outputType: "structured",
      structuredKind: "practiceSet",
      data: verified.data,
      resultData: JSON.stringify(verified.data),
      meta: verified.meta,
    };
  }

  if (tool.outputType === "structured" && tool.structuredKind) {
    const kind = tool.structuredKind;
    const isEmpty =
      kind === "mathGraph" ? (data: unknown) => isEmptyMathGraph(data as MathGraph) : undefined;
    const parsed = await parseStructuredWithRetry(
      (r) => parseStructured(kind, r).data,
      raw,
      meta,
      tool,
      input,
      isEmpty,
    );
    return {
      tool,
      outputType: "structured",
      structuredKind: kind,
      data: parsed.data,
      resultData: JSON.stringify(parsed.data),
      meta: parsed.meta,
    };
  }

  if (tool.outputType === "pptx") {
    let deck;
    let pptRaw = raw;

    // 2-pass: outline → fill (품질·구조 안정화)
    try {
      const outlineTool: ToolDef = {
        ...tool,
        systemInstruction: PPT_OUTLINE_INSTRUCTION,
      };
      const outlineText = await geminiGenerateForTool({
        tool: outlineTool,
        text: input.text,
        images: input.images,
      });
      const fillTool: ToolDef = {
        ...tool,
        systemInstruction: `${tool.systemInstruction}\n\n${PPT_FILL_INSTRUCTION_PREFIX}\n\n[아웃라인]\n${outlineText}`,
      };
      const filled = await generateWithFallback({
        tool: fillTool,
        text: input.text,
        audio: input.audio,
        images: input.images,
        modelTier: input.modelTier,
        onAttempt: input.onAttempt,
      });
      pptRaw = filled.text;
      meta = { provider: filled.provider, model: filled.model, attempts: meta.attempts + filled.attempts };
    } catch (err) {
      console.warn("[toolGeneration] ppt 2-pass fallback to single pass", err);
    }

    try {
      deck = parseDeck(pptRaw);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "PPT 파싱 실패";
      console.error("[toolGeneration] pptx parse", msg, pptRaw.slice(0, 400));
      throw new Error(msg);
    }

    let validation = validateDeck(deck);
    if (!validation.ok) {
      try {
        const retryTool: ToolDef = {
          ...tool,
          systemInstruction: `${tool.systemInstruction}\n\n[검증 실패 — 아래 문제를 고쳐 다시 JSON만 출력]\n${validation.issues.map((i) => i.message).join("\n")}`,
        };
        const retry = await generateWithFallback({
          tool: retryTool,
          text: input.text,
          modelTier: input.modelTier,
          onAttempt: input.onAttempt,
        });
        deck = parseDeck(retry.text);
        meta = {
          provider: retry.provider,
          model: retry.model,
          attempts: meta.attempts + retry.attempts,
        };
        validation = validateDeck(deck);
      } catch (retryErr) {
        console.warn("[toolGeneration] ppt validate retry failed", retryErr);
      }
    }

    input.onUploadStart?.();
    const base64 = await buildPptxBase64(deck);
    const safeName = (deck.title || tool.fileBaseName)
      .replace(/[\\/:*?"<>|]+/g, "")
      .slice(0, 40) || tool.fileBaseName;
    const blob = await put(
      `history/${input.userId}/${tool.fileBaseName}-${Date.now()}.pptx`,
      Buffer.from(base64, "base64"),
      { access: "public", contentType: PPTX_MIME, addRandomSuffix: true },
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
    const xlsxValidation = validateWorkbook(wb);
    if (!xlsxValidation.ok) {
      throw new Error(xlsxValidation.issues[0]?.message ?? "엑셀 구조 검증 실패");
    }
    input.onUploadStart?.();
    let base64: string;
    try {
      base64 = await buildXlsxBase64(wb);
    } catch (err) {
      console.error("[toolGeneration] xlsx build", err);
      throw new Error("엑셀 파일 생성에 실패했습니다. 다시 시도해 주세요.");
    }
    const safeName = (wb.title || tool.fileBaseName)
      .replace(/[\\/:*?"<>|]+/g, "")
      .slice(0, 40) || tool.fileBaseName;
    const blob = await put(
      `history/${input.userId}/${tool.fileBaseName}-${Date.now()}.xlsx`,
      Buffer.from(base64, "base64"),
      { access: "public", contentType: XLSX_MIME, addRandomSuffix: true },
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

  // word-doc: real .docx export
  if (tool.id === "word-doc") {
    input.onUploadStart?.();
    const doc = parseMarkdownSections(raw);
    const base64 = await buildDocxBase64(doc);
    const safeName = doc.title.replace(/[\\/:*?"<>|]+/g, "").slice(0, 40) || tool.fileBaseName;
    const blob = await put(
      `history/${input.userId}/${tool.fileBaseName}-${Date.now()}.docx`,
      Buffer.from(base64, "base64"),
      { access: "public", contentType: DOCX_MIME, addRandomSuffix: true },
    );
    return {
      tool,
      outputType: "docx",
      text: raw,
      file: { url: blob.url, filename: `${safeName}.docx`, mimeType: DOCX_MIME },
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
        { access: "public", contentType: "text/markdown; charset=utf-8", addRandomSuffix: true },
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
