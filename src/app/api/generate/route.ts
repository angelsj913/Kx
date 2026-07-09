import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateWithFallback } from "@/lib/ai";
import { getTool } from "@/lib/tools";
import { friendlyError } from "@/lib/errors";
import { parseDeck, buildPptxBase64 } from "@/lib/pptx";
import { parseWorkbook, buildXlsxBase64 } from "@/lib/xlsx";
import { parseStructured } from "@/lib/structured";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let toolId = "";
    let text = "";
    let audio: { data: string; mimeType: string } | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      toolId = String(form.get("toolId") ?? "");
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

    const raw = await generateWithFallback({ tool, text, audio });
    if (!raw) {
      return NextResponse.json(
        { error: "AI가 빈 응답을 반환했습니다. 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    if (tool.outputType === "structured" && tool.structuredKind) {
      const structured = parseStructured(tool.structuredKind, raw);
      const item = await prisma.historyItem.create({
        data: {
          userId,
          toolId: tool.id,
          toolLabel: tool.short,
          outputType: "structured",
          prompt: text,
          result: JSON.stringify(structured.data),
        },
      });

      return NextResponse.json({
        id: item.id,
        outputType: "structured",
        structuredKind: tool.structuredKind,
        data: structured.data,
      });
    }

    if (tool.outputType === "pptx") {
      const deck = parseDeck(raw);
      const base64 = await buildPptxBase64(deck);
      const blob = await put(
        `history/${userId}/${tool.fileBaseName}-${Date.now()}.pptx`,
        Buffer.from(base64, "base64"),
        { access: "public", contentType: PPTX_MIME }
      );

      const item = await prisma.historyItem.create({
        data: {
          userId,
          toolId: tool.id,
          toolLabel: tool.short,
          outputType: "pptx",
          prompt: text,
          result: JSON.stringify(deck),
          fileUrl: blob.url,
          fileName: `${tool.fileBaseName}.pptx`,
        },
      });

      return NextResponse.json({
        id: item.id,
        outputType: "pptx",
        preview: deck,
        file: { url: blob.url, filename: item.fileName, mimeType: PPTX_MIME },
      });
    }

    if (tool.outputType === "xlsx") {
      const wb = parseWorkbook(raw);
      const base64 = await buildXlsxBase64(wb);
      const blob = await put(
        `history/${userId}/${tool.fileBaseName}-${Date.now()}.xlsx`,
        Buffer.from(base64, "base64"),
        { access: "public", contentType: XLSX_MIME }
      );

      const item = await prisma.historyItem.create({
        data: {
          userId,
          toolId: tool.id,
          toolLabel: tool.short,
          outputType: "xlsx",
          prompt: text,
          result: JSON.stringify(wb),
          fileUrl: blob.url,
          fileName: `${tool.fileBaseName}.xlsx`,
        },
      });

      return NextResponse.json({
        id: item.id,
        outputType: "xlsx",
        preview: wb,
        file: { url: blob.url, filename: item.fileName, mimeType: XLSX_MIME },
      });
    }

    const item = await prisma.historyItem.create({
      data: {
        userId,
        toolId: tool.id,
        toolLabel: tool.short,
        outputType: "markdown",
        prompt: text,
        result: raw,
      },
    });

    return NextResponse.json({ id: item.id, outputType: "markdown", text: raw });
  } catch (err) {
    console.error("generate error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
