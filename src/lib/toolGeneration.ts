import { put } from "@vercel/blob";
import { generateWithFallback, type AttemptInfo, type FallbackResult } from "./ai";
import { getTool, type ToolDef } from "./tools";
import { parseDeck, buildPptxBase64 } from "./pptx";
import { parseWorkbook, buildXlsxBase64 } from "./xlsx";
import { parseStructured, type StructuredKind } from "./structured";
import type { Deck, Workbook } from "./fileTypes";

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export interface ToolGenerationInput {
  toolId: string;
  text?: string;
  audio?: { data: string; mimeType: string };
  userId: string;
  onAttempt?: (info: AttemptInfo) => void;
  onUploadStart?: () => void;
}

interface Meta {
  provider: FallbackResult["provider"];
  model: FallbackResult["model"];
  attempts: number;
}

export type ToolGenerationResult =
  | { tool: ToolDef; outputType: "markdown"; text: string; meta: Meta }
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

/** /api/generate가 하던 파싱→빌드→업로드 로직을 히스토리 저장 없이 재사용 가능한 형태로 뽑아낸 것. */
export async function runToolGeneration(
  input: ToolGenerationInput
): Promise<ToolGenerationResult> {
  const tool = getTool(input.toolId);
  if (!tool) throw new Error("알 수 없는 도구입니다.");

  if (tool.inputType === "audio") {
    if (!input.audio) throw new Error("오디오 파일을 첨부해 주세요.");
  } else if (!input.text) {
    throw new Error("요청할 내용을 입력해 주세요.");
  }

  const { text: raw, provider, model, attempts } = await generateWithFallback({
    tool,
    text: input.text,
    audio: input.audio,
    onAttempt: input.onAttempt,
  });
  if (!raw) throw new Error("AI가 빈 응답을 반환했습니다. 다시 시도해 주세요.");
  const meta: Meta = { provider, model, attempts };

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
    const deck = parseDeck(raw);
    input.onUploadStart?.();
    const base64 = await buildPptxBase64(deck);
    const blob = await put(
      `history/${input.userId}/${tool.fileBaseName}-${Date.now()}.pptx`,
      Buffer.from(base64, "base64"),
      { access: "public", contentType: PPTX_MIME }
    );
    return {
      tool,
      outputType: "pptx",
      preview: deck,
      resultData: JSON.stringify(deck),
      file: { url: blob.url, filename: `${tool.fileBaseName}.pptx`, mimeType: PPTX_MIME },
      meta,
    };
  }

  if (tool.outputType === "xlsx") {
    const wb = parseWorkbook(raw);
    input.onUploadStart?.();
    const base64 = await buildXlsxBase64(wb);
    const blob = await put(
      `history/${input.userId}/${tool.fileBaseName}-${Date.now()}.xlsx`,
      Buffer.from(base64, "base64"),
      { access: "public", contentType: XLSX_MIME }
    );
    return {
      tool,
      outputType: "xlsx",
      preview: wb,
      resultData: JSON.stringify(wb),
      file: { url: blob.url, filename: `${tool.fileBaseName}.xlsx`, mimeType: XLSX_MIME },
      meta,
    };
  }

  return { tool, outputType: "markdown", text: raw, meta };
}
