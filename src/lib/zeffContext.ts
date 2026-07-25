import { retrieveChunks, type RankedChunk } from "@/lib/ragSearch";
import { formatLearnedInstruction, retrieveLearnedContext } from "@/lib/userLearning";
import { citationRules } from "@/lib/prompts/registry";

const RAG_TOP_K = 4;

// 응답 언어 규칙: UI 설정 언어를 강요하지 않고, "사용자가 방금 입력한 언어"에 맞춰
// 답한다. 설정이 영어인데 한국어로 물으면 영어를 강요해 언어가 섞이던 버그를 없앤다.
// 입력 언어를 알 수 없거나 지원하지 않으면 영어로 답한다.
const RESPONSE_LANGUAGE_LINE =
  "답변 언어 규칙(매우 중요): 사용자가 방금 보낸 메시지와 정확히 같은 언어로만 답합니다. " +
  "UI 설정 언어가 무엇이든 무시하고, 오직 사용자의 입력 언어를 따릅니다. " +
  "여러 언어를 한 답변에 섞지 않습니다. " +
  "입력 언어를 판별할 수 없거나 지원 언어(한국어·영어·일본어·중국어·러시아어·독일어·프랑스어·스페인어·아랍어)에 없으면 영어로 답합니다. " +
  "결론을 먼저, 짧고 실무적으로 작성합니다.";

function buildZeffSystemPrompt(): string {
  const responseLine = RESPONSE_LANGUAGE_LINE;
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

export interface ZeffRuntimeContext {
  instruction: string;
  citations: RankedChunk[];
}

export async function buildZeffRuntimeInstruction(args: {
  userId: string;
  workspaceId: string | null;
  query: string;
  language?: string | null;
}): Promise<string> {
  const ctx = await buildZeffRuntimeContext(args);
  return ctx.instruction;
}

export async function buildZeffRuntimeContext(args: {
  userId: string;
  workspaceId: string | null;
  query: string;
  language?: string | null;
}): Promise<ZeffRuntimeContext> {
  const sections = [`[ZEFF 운영 규칙]\n${buildZeffSystemPrompt()}`];
  const query = args.query.trim();
  let citations: RankedChunk[] = [];

  if (query) {
    try {
      const learned = await retrieveLearnedContext({ userId: args.userId, query, k: 2 });
      const learnedBlock = formatLearnedInstruction(learned);
      if (learnedBlock) sections.push(learnedBlock);

      const { ranked, empty } = await retrieveChunks({
        userId: args.userId,
        workspaceId: args.workspaceId,
        query,
        k: RAG_TOP_K,
      });

      if (!empty && ranked.length) {
        citations = ranked;
        const context = ranked
          .map((r) => `[${r.n}] ${r.title}\n${r.content}`)
          .join("\n\n");

        sections.push(
          [
            "[검색된 운영 컨텍스트]",
            citationRules,
            "아래는 현재 워크스페이스/서재에서 색인된 문서 중 질문과 관련 있는 발췌문입니다.",
            "관련이 약하면 일반 규칙만 따르고, 근거가 없으면 답변에 명시합니다.",
            context,
          ].join("\n"),
        );
      } else if (!empty) {
        sections.push(
          "[검색 결과] 색인된 문서는 있으나 이번 질문과의 관련도가 낮습니다. 추측하지 말고 근거 부족을 명시하세요.",
        );
      }
    } catch (err) {
      console.warn("[zeffContext] runtime context skipped:", err);
    }
  }

  return { instruction: sections.join("\n\n"), citations };
}

/**
 * free chat / agent / quick-tool 경로가 공유하는 런타임 컨텍스트 조립.
 * (내부적으로 buildZeffRuntimeContext와 동일 — 진입점을 하나로 고정)
 */
export async function assembleRuntimeContext(args: {
  userId: string;
  workspaceId: string | null;
  query: string;
  language?: string | null;
}): Promise<ZeffRuntimeContext> {
  return buildZeffRuntimeContext(args);
}
