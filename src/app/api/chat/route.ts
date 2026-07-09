import { NextResponse } from "next/server";
import {
  geminiChatReply,
  MissingApiKeyError,
  type ChatMessage,
} from "@/lib/gemini";
import { openrouterChatReply } from "@/lib/openrouter";
import { getModel, DEFAULT_MODEL } from "@/lib/models";
import { getPersona } from "@/lib/personas";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  return input.map((m): ChatMessage => {
    const msg = m as Record<string, unknown>;
    return {
      role: msg?.role === "model" ? "model" : "user",
      text: typeof msg?.text === "string" ? msg.text : "",
      files: Array.isArray(msg?.files)
        ? (msg.files as unknown[]).map((f) => {
            const file = f as Record<string, unknown>;
            return {
              data: typeof file?.data === "string" ? file.data : "",
              mimeType:
                typeof file?.mimeType === "string"
                  ? file.mimeType
                  : "application/octet-stream",
            };
          })
        : undefined,
    };
  });
}

export async function POST(request: Request) {
  try {
    const geminiKey = request.headers.get("x-gemini-key") ?? undefined;
    const openrouterKey = request.headers.get("x-openrouter-key") ?? undefined;

    const body = await request.json();
    const modelId = typeof body?.model === "string" ? body.model : DEFAULT_MODEL;
    const persona = getPersona(body?.personaId);
    const messages = sanitizeMessages(body?.messages);

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "메시지를 입력해 주세요." },
        { status: 400 }
      );
    }

    const modelDef = getModel(modelId);

    const text =
      modelDef.provider === "gemini"
        ? await geminiChatReply({
            model: modelDef.model,
            apiKey: geminiKey,
            systemInstruction: persona.systemInstruction,
            messages,
          })
        : await openrouterChatReply({
            model: modelDef.model,
            apiKey: openrouterKey,
            systemInstruction: persona.systemInstruction,
            messages,
          });

    if (!text) {
      return NextResponse.json(
        { error: "AI가 빈 응답을 반환했습니다. 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    return NextResponse.json({ text });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("chat error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
