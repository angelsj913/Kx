import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { geminiChatReply, type ChatFile } from "@/lib/gemini";
import { groqChatReply } from "@/lib/groq";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── API 키: 실제 값은 여기에 직접 적지 말고 .env.local에 넣으세요 (git에 커밋되지 않음) ──
//   GEMINI_API_KEY  → https://aistudio.google.com/apikey 에서 발급
//   GROQ_API_KEY    → https://console.groq.com/keys 에서 발급
const GOOGLE_GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ── 백스테이지 멀티 에이전트 레지스트리 ──
// 사용자에게는 절대 노출되지 않는 내부 전용 구성이다. 질문 키워드를 보고
// 가장 적합한 에이전트를 고른 뒤, 실패하면 다음 순번 에이전트로 자동 failover한다.
interface Agent {
  id: string;
  label: string;
  provider: "gemini" | "groq";
  model: string;
  match: RegExp | null; // null = catch-all(기본) 에이전트
  systemInstruction: string;
}

const REASONING_MODEL = "openai/gpt-oss-120b";
const RESEARCH_MODEL = "gemini-2.5-pro";
const WRITING_MODEL = "gemini-2.5-flash";

const AGENTS: Agent[] = [
  {
    id: "reasoning",
    label: "추론 에이전트",
    provider: "groq",
    model: REASONING_MODEL,
    match:
      /수학|미분|적분|방정식|부등식|행렬|벡터|극한|확률|통계|증명|인수분해|로그|삼각함수|미적분|기하|알고리즘|코드|디버그|리팩터|최적화|시간복잡도|풀어줘|계산해|[0-9]\s*[+\-*/^=]\s*[0-9]/,
    systemInstruction:
      "너는 zeff의 추론 전담 에이전트다. 수학·논리·코드처럼 정확한 단계적 사고가 필요한 문제를 근거와 함께 명확하게 풀어라.",
  },
  {
    id: "research",
    label: "리서치 에이전트",
    provider: "gemini",
    model: RESEARCH_MODEL,
    match: /논문|레포트|리서치|보고서|비교|분석해|조사해|초안|요약해/,
    systemInstruction:
      "너는 zeff의 리서치 전담 에이전트다. 레포트·논문·보고서처럼 구조화된 정리가 필요한 요청에 근거를 갖춘 체계적인 답변을 작성하라.",
  },
  {
    id: "writing",
    label: "라이팅 에이전트",
    provider: "gemini",
    model: WRITING_MODEL,
    match: null,
    systemInstruction: "너는 zeff라는 친절하고 유능한 AI 어시스턴트다. 사용자의 메시지에 자연스럽고 명확하게 답하라.",
  },
];

const LANGUAGE_DIRECTIVE: Record<string, string> = {
  ko: "모든 답변은 한국어로 작성한다.",
  en: "Respond only in English, regardless of the language of the question.",
};

/** 질문 내용과 첨부파일 유무를 보고 시도할 에이전트 순서(=failover 체인)를 정한다.
 * 멀티모달(이미지·문서 첨부)은 이 코드베이스에서 Gemini 계열만 지원하므로,
 * 파일이 있으면 Groq 기반 추론 에이전트는 체인에서 제외한다. */
function buildAgentChain(message: string, hasFiles: boolean): Agent[] {
  const pool = hasFiles ? AGENTS.filter((a) => a.provider === "gemini") : AGENTS;
  const primary = pool.find((a) => a.match && a.match.test(message)) ?? pool.find((a) => a.match === null) ?? pool[0];
  const rest = pool.filter((a) => a.id !== primary.id);
  return [primary, ...rest];
}

async function callAgent(agent: Agent, message: string, files: ChatFile[], language: string): Promise<string> {
  const systemInstruction = `${agent.systemInstruction} ${LANGUAGE_DIRECTIVE[language] ?? LANGUAGE_DIRECTIVE.ko}`;
  const messages = [{ role: "user" as const, text: message, files: files.length ? files : undefined }];
  if (agent.provider === "gemini") {
    return geminiChatReply({ apiKey: GOOGLE_GEMINI_API_KEY, model: agent.model, systemInstruction, messages });
  }
  return groqChatReply({ apiKey: GROQ_API_KEY, model: agent.model, systemInstruction, messages });
}

interface IncomingFile {
  data: string;
  mimeType: string;
  name: string;
}

async function parseRequest(req: Request): Promise<{ message: string; sessionId: string | null; files: IncomingFile[] }> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const message = String(form.get("message") ?? "").trim();
    const sessionId = (form.get("sessionId") as string | null) || null;
    const files: IncomingFile[] = [];
    for (const entry of form.getAll("files")) {
      if (entry instanceof File) {
        const buf = Buffer.from(await entry.arrayBuffer());
        files.push({ data: buf.toString("base64"), mimeType: entry.type || "application/octet-stream", name: entry.name });
      }
    }
    return { message, sessionId, files };
  }
  const body = await req.json().catch(() => ({}));
  return {
    message: typeof body?.message === "string" ? body.message.trim() : "",
    sessionId: typeof body?.sessionId === "string" ? body.sessionId : null,
    files: [],
  };
}

/** 개행으로 구분된 JSON 이벤트를 순서대로 흘려보내는 스트림 응답.
 * 클라이언트는 fetch().body 리더로 한 줄씩 읽어 실시간 상태 메시지를 표시한다. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "로그인이 필요합니다." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const userId = session.user.id;

  const { message, sessionId, files } = await parseRequest(req);
  if (!message && files.length === 0) {
    return new Response(JSON.stringify({ error: "메시지를 입력해 주세요." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: Record<string, unknown>) {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      }

      try {
        const settings = await prisma.userSettings.findUnique({ where: { userId } });
        const language = settings?.language ?? "ko";

        if (files.length > 0) send({ type: "status", key: "filesChecking" });
        send({ type: "status", key: "analyzing" });

        const chatFiles: ChatFile[] = files.map((f) => ({ data: f.data, mimeType: f.mimeType }));
        const chain = buildAgentChain(message, files.length > 0);

        let reply = "";
        let usedAgent: Agent = chain[0];
        const attempts: { agent: string; ok: boolean; error?: string }[] = [];

        for (let i = 0; i < chain.length; i++) {
          const agent = chain[i];
          send({ type: "status", key: "agentWorking", agentId: agent.id });
          try {
            const result = await callAgent(agent, message, chatFiles, language);
            if (result && result.trim()) {
              reply = result;
              usedAgent = agent;
              attempts.push({ agent: agent.id, ok: true });
              break;
            }
            attempts.push({ agent: agent.id, ok: false, error: "빈 응답" });
          } catch (err) {
            attempts.push({ agent: agent.id, ok: false, error: err instanceof Error ? err.message : String(err) });
          }
          if (i < chain.length - 1) {
            send({ type: "status", key: "failover" });
          }
        }

        if (!reply) {
          send({ type: "error", key: "noReply" });
          controller.close();
          return;
        }

        send({ type: "status", key: "saving" });

        let sid = sessionId;
        if (sid) {
          const owned = await prisma.chatSession.findFirst({ where: { id: sid, userId } });
          if (!owned) sid = null;
        }
        if (!sid) {
          const created = await prisma.chatSession.create({
            data: { userId, title: message.slice(0, 40) || "새 대화" },
          });
          sid = created.id;
        } else {
          await prisma.chatSession.update({ where: { id: sid }, data: { updatedAt: new Date() } });
        }

        const saved = await prisma.chatHistory.create({
          data: {
            userId,
            sessionId: sid,
            message: message || "(첨부 파일)",
            reply,
            agent: usedAgent.id,
            provider: usedAgent.provider,
            model: usedAgent.model,
            attempts,
          },
        });

        send({
          type: "done",
          id: saved.id,
          sessionId: sid,
          message: saved.message,
          reply: saved.reply,
          createdAt: saved.createdAt,
        });
      } catch (err) {
        console.error("chat pipeline error:", err);
        send({ type: "error", message: friendlyError(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
