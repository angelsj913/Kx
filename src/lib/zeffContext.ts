import { prisma } from "@/lib/prisma";
import { topK } from "@/lib/rag";
import { embedQuery } from "@/lib/embeddings";
import { listWhere } from "@/lib/workspace";

const RAG_CANDIDATE_LIMIT = 1200;
const RAG_TOP_K = 4;

interface EmbeddedChunk {
  content: string;
  embedding: number[];
  libraryItemId: string;
}

// 사용자의 워크스페이스 언어 설정에 맞춰 응답 언어를 지시 — UI 언어를 바꿔도
// AI 응답은 항상 한국어로 고정되던 문제를 해결한다.
const RESPONSE_LANGUAGE_LINE: Record<string, string> = {
  ko: "답변은 한국어로, 결론 먼저, 짧고 실무적으로 작성합니다.",
  en: "Reply in English, lead with the conclusion, and keep it short and practical.",
  ja: "日本語で、結論を先に、短く実務的に回答します。",
  zh: "请用中文回答，先给结论，简短实用。",
  ru: "Отвечайте на русском языке, сначала выводы, кратко и по делу.",
  de: "Antworten Sie auf Deutsch, zuerst das Ergebnis, kurz und praxisnah.",
  fr: "Répondez en français, en commençant par la conclusion, de façon brève et pratique.",
  es: "Responde en español, empezando por la conclusión, de forma breve y práctica.",
};

// 생성한 데이터셋에서 추출한 운영 규칙의 런타임 반영본.
function buildZeffSystemPrompt(language?: string | null): string {
  const responseLine = RESPONSE_LANGUAGE_LINE[language ?? "ko"] ?? RESPONSE_LANGUAGE_LINE.ko;
  return [
    "당신은 ZEFF AI 운영 문맥을 따르는 도우미입니다.",
    "공식 도메인은 https://zeffai.com 입니다.",
    "당신은 ZEFF AI라는 하나의 어시스턴트 페르소나입니다. 매 요청마다 여러 AI 제공사 중 자동으로 선택된 모델이 응답을 생성하며, 어떤 제공사·모델이 답했는지는 사용자에게 중요하지 않습니다.",
    "고정된 단일 학습 데이터셋이나 학습 시점을 갖고 있다고 단정하지 않습니다. '무슨 데이터로 학습됐어?', '너는 어떤 모델이야?' 같은 질문에는 특정 회사·모델명을 단정적으로 밝히지 않고, ZEFF AI로서 도울 수 있는 것으로 화제를 자연스럽게 돌립니다.",
    "ZEFF AI는 웹앱 중심 서비스이며, 데스크톱과 모바일은 웹앱을 여는 셸 앱으로 설명합니다.",
    "사용자가 이미 결정한 방향은 다시 설득하지 않고 다음 실행 단계로 이어갑니다.",
    "비용 민감도를 우선 반영하고, 더 싸고 단순한 방법부터 제안합니다.",
    "Groq는 현재 프로젝트에서 추론 제공자로 설명하고 학습 플랫폼처럼 단정하지 않습니다.",
    "Windows unsigned .exe가 SmartScreen 경고 없이 설치된다고 말하지 않습니다.",
    "Play Store 등록이 끝나지 않았다면 공개 완료처럼 말하지 않습니다.",
    "Prisma 7.8에서는 prisma db push --skip-generate 를 다시 제안하지 않습니다.",
    "확인되지 않은 사실은 단정하지 않고 현재 기준 또는 확인 필요 여부를 분명히 말합니다.",
    responseLine,
  ].join("\n");
}

// 이전 코드와의 호환을 위해 한국어 기본값을 유지한다.
export const ZEFF_SYSTEM_PROMPT = buildZeffSystemPrompt("ko");

export async function buildZeffRuntimeInstruction(args: {
  userId: string;
  workspaceId: string | null;
  query: string;
  language?: string | null;
}): Promise<string> {
  const sections = [`[ZEFF 운영 규칙]\n${buildZeffSystemPrompt(args.language)}`];
  const query = args.query.trim();

  if (!query) return sections.join("\n\n");

  try {
    const chunks: EmbeddedChunk[] = await prisma.documentChunk.findMany({
      where: listWhere({ workspaceId: args.workspaceId }, args.userId),
      take: RAG_CANDIDATE_LIMIT,
      select: { content: true, embedding: true, libraryItemId: true },
    });

    if (chunks.length === 0) return sections.join("\n\n");

    const { vector } = await embedQuery(query);
    const ranked = topK(vector, chunks, RAG_TOP_K).filter((r) => r.score > 0.18);
    if (ranked.length === 0) return sections.join("\n\n");

    const itemIds = [...new Set(ranked.map((r) => r.item.libraryItemId))];
    const items = await prisma.libraryItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, title: true },
    });
    const titleOf = new Map<string, string>(items.map((item) => [item.id, item.title]));

    const context = ranked
      .map(
        (r, i) =>
          `[${i + 1}] ${titleOf.get(r.item.libraryItemId) ?? "문서"}\n${r.item.content}`,
      )
      .join("\n\n");

    sections.push(
      [
        "[검색된 운영 컨텍스트]",
        "아래는 현재 프로젝트에서 색인된 문서 중 질문과 가장 관련 있는 발췌문입니다.",
        "이 컨텍스트가 질문과 직접 관련 있으면 우선 참고하고, 관련이 약하면 일반 규칙만 따릅니다.",
        context,
      ].join("\n"),
    );
  } catch (err) {
    console.warn("[zeffContext] runtime context skipped:", err);
  }

  return sections.join("\n\n");
}
