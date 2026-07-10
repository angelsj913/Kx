import { NextResponse } from "next/server";
import { geminiChatReply, MissingApiKeyError } from "@/lib/gemini";
import { groqChatReply } from "@/lib/groq";
import { openrouterChatReply } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";

// 3개 프로바이더를 손쉽게 전환하며 테스트하기 위한 최소 뼈대 라우트.
// 매 호출을 ChatHistory 테이블(schema.prisma 참고)에 남긴다 — 실제 서비스
// 채팅(/api/chat/conversations/...)과는 별개의 가벼운 1턴 로그다.
// 배포 환경에 그대로 열어두면 인증 없이 유료 API를 호출할 수 있으므로 프로덕션에서는 막아둔다.

// ── API 키: 실제 값은 여기에 직접 적지 말고 .env.local에 넣으세요 (git에 커밋되지 않음) ──
//   GEMINI_API_KEY      → https://aistudio.google.com/apikey 에서 발급
//   GROQ_API_KEY        → https://console.groq.com/keys 에서 발급
//   OPENROUTER_API_KEY  → https://openrouter.ai/keys 에서 발급
// 아래 세 상수는 어떤 키가 어느 프로바이더로 들어가는지 코드만 보고 바로 알 수 있도록
// 이름을 맞춰둔 것뿐이고, 실제 값은 process.env에서 그대로 가져온다.
const GOOGLE_GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

type Provider = "gemini" | "groq" | "openrouter";

const DEFAULT_MODELS: Record<Provider, string> = {
  gemini: "gemini-2.5-flash",
  groq: "openai/gpt-oss-120b",
  openrouter: "meta-llama/llama-3.3-70b-instruct:free",
};

const SYSTEM_INSTRUCTION = "너는 친절한 AI 비서다. 답변은 한국어로 간결하게 한다.";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { provider?: string; model?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바른 JSON이 아닙니다." }, { status: 400 });
  }

  const { provider, model, message } = body;

  if (provider !== "gemini" && provider !== "groq" && provider !== "openrouter") {
    return NextResponse.json(
      { error: 'provider는 "gemini" | "groq" | "openrouter" 중 하나여야 합니다.' },
      { status: 400 }
    );
  }
  if (!message || !message.trim()) {
    return NextResponse.json({ error: "message는 필수입니다." }, { status: 400 });
  }

  const selectedModel = model?.trim() || DEFAULT_MODELS[provider];
  const messages = [{ role: "user" as const, text: message }];

  try {
    let reply: string;
    if (provider === "gemini") {
      reply = await geminiChatReply({
        apiKey: GOOGLE_GEMINI_API_KEY,
        model: selectedModel,
        systemInstruction: SYSTEM_INSTRUCTION,
        messages,
      });
    } else if (provider === "groq") {
      reply = await groqChatReply({
        apiKey: GROQ_API_KEY,
        model: selectedModel,
        systemInstruction: SYSTEM_INSTRUCTION,
        messages,
      });
    } else {
      reply = await openrouterChatReply({
        apiKey: OPENROUTER_API_KEY,
        model: selectedModel,
        systemInstruction: SYSTEM_INSTRUCTION,
        messages,
      });
    }
    // DATABASE_URL로 연결된 DB(schema.prisma의 ChatHistory 테이블)에 이번 대화 저장.
    // 이 라우트는 아직 로그인 세션을 확인하지 않으므로 userId는 비워둔다 — 나중에
    // NextAuth 세션을 붙이면 이 자리에 실제 로그인한 사용자의 id를 넣으면 된다.
    const saved = await prisma.chatHistory.create({
      data: { provider, model: selectedModel, message, reply },
    });

    return NextResponse.json({ id: saved.id, provider, model: selectedModel, reply });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
    const status = err instanceof MissingApiKeyError ? 400 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

// 최근 대화 내역 불러오기: GET /api/chat?limit=20
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const limitParam = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 20;

  try {
    const items = await prisma.chatHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ items });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "히스토리를 불러오지 못했습니다.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
