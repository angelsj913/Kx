import { NextResponse } from "next/server";
import { generateContent, isMode, MissingApiKeyError, type Mode } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let prompt: string;
  let mode: Mode;
  try {
    const body = await request.json();
    prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    mode = isMode(body?.mode) ? body.mode : "business";
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  if (!prompt) {
    return NextResponse.json({ error: "요청할 내용을 입력해 주세요." }, { status: 400 });
  }

  try {
    const text = await generateContent(prompt, mode);
    if (!text) {
      return NextResponse.json(
        { error: "AI가 빈 응답을 반환했습니다. 다시 시도해 주세요." },
        { status: 502 }
      );
    }
    return NextResponse.json({ text });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("Gemini API error:", err);
    return NextResponse.json(
      { error: "AI 요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
