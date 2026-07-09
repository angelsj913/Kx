import { NextResponse } from "next/server";
import { geminiGenerateForTool, MissingApiKeyError } from "@/lib/gemini";
import { openrouterGenerateForTool } from "@/lib/openrouter";
import { getTool } from "@/lib/tools";
import { getModel, DEFAULT_MODEL } from "@/lib/models";
import { friendlyError } from "@/lib/errors";
import { parseDeck, buildPptxBase64 } from "@/lib/pptx";
import { parseWorkbook, buildXlsxBase64 } from "@/lib/xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function POST(request: Request) {
  try {
    const geminiKey = request.headers.get("x-gemini-key") ?? undefined;
    const openrouterKey = request.headers.get("x-openrouter-key") ?? undefined;

    const contentType = request.headers.get("content-type") ?? "";
    let toolId = "";
    let text = "";
    let modelId = DEFAULT_MODEL;
    let audio: { data: string; mimeType: string } | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      toolId = String(form.get("toolId") ?? "");
      modelId = String(form.get("model") ?? DEFAULT_MODEL);
      const file = form.get("audio");
      if (file instanceof File) {
        const buf = Buffer.from(await file.arrayBuffer());
        audio = {
          data: buf.toString("base64"),
          mimeType: file.type || "audio/webm",
        };
      }
    } else {
      const body = await request.json();
      toolId = typeof body?.toolId === "string" ? body.toolId : "";
      text = typeof body?.text === "string" ? body.text.trim() : "";
      if (typeof body?.model === "string") modelId = body.model;
    }

    const tool = getTool(toolId);
    if (!tool) {
      return NextResponse.json({ error: "알 수 없는 도구입니다." }, { status: 400 });
    }

    if (tool.inputType === "audio") {
      if (!audio) {
        return NextResponse.json(
          { error: "오디오 파일을 첨부해 주세요." },
          { status: 400 }
        );
      }
    } else if (!text) {
      return NextResponse.json(
        { error: "요청할 내용을 입력해 주세요." },
        { status: 400 }
      );
    }

    const modelDef = getModel(modelId);
    // 영상/오디오 도구는 Gemini 멀티모달만 지원하므로 Gemini로 고정
    const forceGemini = tool.inputType === "url" || tool.inputType === "audio";
    const useGemini = forceGemini || modelDef.provider === "gemini";

    const raw = useGemini
      ? await geminiGenerateForTool({
          tool,
          text,
          audio,
          model: forceGemini ? "gemini-2.5-flash" : modelDef.model,
          apiKey: geminiKey,
        })
      : await openrouterGenerateForTool({
          tool,
          text,
          model: modelDef.model,
          apiKey: openrouterKey,
        });

    if (!raw) {
      return NextResponse.json(
        { error: "AI가 빈 응답을 반환했습니다. 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    if (tool.outputType === "pptx") {
      const deck = parseDeck(raw);
      const base64 = await buildPptxBase64(deck);
      return NextResponse.json({
        outputType: "pptx",
        preview: deck,
        raw: JSON.stringify(deck),
        file: {
          base64,
          filename: `${tool.fileBaseName}.pptx`,
          mimeType: PPTX_MIME,
        },
      });
    }

    if (tool.outputType === "xlsx") {
      const wb = parseWorkbook(raw);
      const base64 = await buildXlsxBase64(wb);
      return NextResponse.json({
        outputType: "xlsx",
        preview: wb,
        raw: JSON.stringify(wb),
        file: {
          base64,
          filename: `${tool.fileBaseName}.xlsx`,
          mimeType: XLSX_MIME,
        },
      });
    }

    return NextResponse.json({ outputType: "markdown", text: raw });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "AI 응답을 해석하지 못했습니다. 다시 시도해 주세요." },
        { status: 502 }
      );
    }
    console.error("generate error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
