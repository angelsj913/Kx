import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { geminiChatReply } from "@/lib/gemini";
import { groqChatReply } from "@/lib/groq";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── API 키: 실제 값은 여기에 직접 적지 말고 .env.local에 넣으세요 (git에 커밋되지 않음) ──
//   GEMINI_API_KEY  → https://aistudio.google.com/apikey 에서 발급
//   GROQ_API_KEY    → https://console.groq.com/keys 에서 발급
const GOOGLE_GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ── 모델 선택 ──
// 초안(draft): Groq — 빠르고 저렴하게 1차 풀이/구조를 만든다.
// 최종(final): Gemini — 초안을 검수·보정하거나(릴레이), 간단한 질문에 바로 답한다(단일 패스).
const DRAFT_MODEL = "openai/gpt-oss-120b";
const FINAL_MODEL_RELAY = "gemini-2.5-pro"; // 검수는 품질을 우선한다
const FINAL_MODEL_SIMPLE = "gemini-2.5-flash"; // 일상 대화는 속도를 우선한다

/**
 * 릴레이(2단계) 파이프라인을 태울지 판단하는 휴리스틱.
 * 수식 기호, 수학/논리/코드 관련 키워드가 보이면 "어려운 질문"으로 간주한다.
 * 정교한 분류가 필요해지면 이 함수만 교체하면 된다(호출부는 그대로 둬도 됨).
 */
function needsRelay(message: string): boolean {
  const MATH_SYMBOLS = /[0-9]\s*[+\-*/^=]\s*[0-9]|√|∫|∑|≤|≥|÷|×/;
  const HARD_KEYWORDS =
    /미분|적분|방정식|부등식|행렬|벡터|극한|확률|통계|증명|인수분해|로그|삼각함수|미적분|기하|함수의|알고리즘|코드|디버그|리팩터|최적화|시간복잡도|아키텍처|설계해|증명해|풀어줘|계산해/;
  return MATH_SYMBOLS.test(message) || HARD_KEYWORDS.test(message);
}

const DRAFT_SYSTEM_INSTRUCTION =
  "너는 내부 리서치 어시스턴트다. 사용자의 질문(특히 수학·논리·코드처럼 정확한 사고가 필요한 문제)에 대해 " +
  "풀이 과정을 단계별로 명확하게 전개한 초안을 작성하라. 이 초안은 최종 사용자에게 그대로 노출되지 않고 " +
  "다른 검수 담당자가 다시 다듬을 예정이므로, 문장을 다듬는 것보다 논리적 정확성과 완결성에 집중하라.";

const FINAL_SYSTEM_INSTRUCTION_RELAY =
  "너는 zeff의 답변을 최종 작성하는 검수 담당자다. 아래에 동료가 작성한 초안이 주어진다. " +
  "초안의 풀이 과정과 결론이 정확한지 검증하고, 오류가 있으면 바로잡아 완성도 높은 하나의 답변으로 다시 써라. " +
  "'초안에 따르면', '동료가 작성한' 같은 표현은 절대 쓰지 말고, 마치 너 혼자 처음부터 답한 것처럼 " +
  "자연스러운 한국어로 작성하라.";

const FINAL_SYSTEM_INSTRUCTION_SIMPLE =
  "너는 zeff라는 친절하고 유능한 AI 어시스턴트다. 사용자의 메시지에 자연스럽고 명확한 한국어로 답하라.";

interface PipelineResult {
  reply: string;
  pipeline: "relay" | "simple";
  model: string;
}

/** Groq가 초안을 만들고 Gemini가 검수·완성하는 2단계 릴레이. Groq가 실패하면 단일 패스로 안전하게 폴백한다. */
async function runRelayPipeline(message: string): Promise<PipelineResult> {
  let draft: string | null = null;
  try {
    draft = await groqChatReply({
      apiKey: GROQ_API_KEY,
      model: DRAFT_MODEL,
      systemInstruction: DRAFT_SYSTEM_INSTRUCTION,
      messages: [{ role: "user", text: message }],
    });
  } catch {
    // Groq가 막히거나 키가 없어도 사용자 경험이 끊기지 않도록 단일 패스로 넘어간다.
    draft = null;
  }

  if (!draft) {
    return runSimplePipeline(message);
  }

  const reply = await geminiChatReply({
    apiKey: GOOGLE_GEMINI_API_KEY,
    model: FINAL_MODEL_RELAY,
    systemInstruction: FINAL_SYSTEM_INSTRUCTION_RELAY,
    messages: [
      {
        role: "user",
        text: `[사용자 질문]\n${message}\n\n[동료가 작성한 초안]\n${draft}`,
      },
    ],
  });

  return { reply, pipeline: "relay", model: `${DRAFT_MODEL} → ${FINAL_MODEL_RELAY}` };
}

/** Gemini 단독 1단계 응답. 캐주얼한 대화용. */
async function runSimplePipeline(message: string): Promise<PipelineResult> {
  const reply = await geminiChatReply({
    apiKey: GOOGLE_GEMINI_API_KEY,
    model: FINAL_MODEL_SIMPLE,
    systemInstruction: FINAL_SYSTEM_INSTRUCTION_SIMPLE,
    messages: [{ role: "user", text: message }],
  });
  return { reply, pipeline: "simple", model: FINAL_MODEL_SIMPLE };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바른 JSON이 아닙니다." }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "message는 필수입니다." }, { status: 400 });
  }

  try {
    // 사용자에게는 절대 노출하지 않는, 내부 전용 백스테이지 판단.
    const result = needsRelay(message)
      ? await runRelayPipeline(message)
      : await runSimplePipeline(message);

    if (!result.reply) {
      return NextResponse.json(
        { error: "AI가 빈 응답을 반환했습니다. 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    const saved = await prisma.chatHistory.create({
      data: {
        userId,
        provider: result.pipeline,
        model: result.model,
        message,
        reply: result.reply,
      },
    });

    return NextResponse.json({
      id: saved.id,
      message: saved.message,
      reply: saved.reply,
      provider: saved.provider,
      model: saved.model,
      createdAt: saved.createdAt,
    });
  } catch (err) {
    console.error("chat pipeline error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}

// 최근 대화 내역 불러오기: GET /api/chat?limit=50
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limitParam = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 50;

  try {
    const items = await prisma.chatHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ items });
  } catch (err) {
    console.error("chat history fetch error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}

// 히스토리 삭제: DELETE /api/chat?id=xxx (개별) 또는 DELETE /api/chat (전체 삭제)
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    const { count } = await prisma.chatHistory.deleteMany({
      where: id ? { id, userId } : { userId },
    });

    if (id && count === 0) {
      return NextResponse.json({ error: "해당 기록을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ deleted: count });
  } catch (err) {
    console.error("chat history delete error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
