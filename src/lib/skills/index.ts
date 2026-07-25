/**
 * ZEFF soft skill packs — 배타 페르소나가 아니라 base + 고신뢰 팩 1~2개 주입.
 * Context-first: 모든 팩은 제품/사용자 맥락을 먼저 읽도록 시작한다.
 */

export type SkillPackId = "code" | "research" | "writing" | "tutoring" | "docs";

export interface SkillPack {
  id: SkillPackId;
  /** 분류·자동 선택용 짧은 설명 */
  description: string;
  /** 시스템 프롬프트에 붙는 매뉴얼 */
  instruction: string;
  /** 의도 매칭용 (한/영) */
  patterns: RegExp[];
}

export const SKILL_PACKS: SkillPack[] = [
  {
    id: "code",
    description: "코딩·디버깅·알고리즘·API 설계",
    instruction: `[스킬 · code]
Context-first: 사용자 목표·언어·제약(프레임워크/버전)을 먼저 확인한 뒤 코드를 제안한다.
- 동작하는 최소 예시부터, 설명은 핵심만.
- 보안·엣지 케이스를 짚고, 추측한 환경은 명시한다.
- 수식·의사코드가 있으면 검증 가능하게 쓴다.`,
    patterns: [
      /코드|코딩|프로그래밍|버그|디버깅|함수|알고리즘|api|typescript|javascript|python|react|next\.?js|sql|refactor|compile|stack\s*trace/i,
      /\b(code|bug|debug|function|implement|endpoint)\b/i,
    ],
  },
  {
    id: "research",
    description: "자료 조사·비교·요약·근거 제시",
    instruction: `[스킬 · research]
Context-first: 질문 범위·이미 아는 사실·필요한 산출물 형태를 먼저 정리한다.
- 핵심 결론을 먼저, 근거·한계를 분명히.
- 불확실하면 단정하지 말고 확인 필요를 표시한다.
- 검색/서재 발췌가 있으면 [n] 인용을 우선한다.`,
    patterns: [
      /조사|리서치|비교|요약|분석해|근거|출처|찾아|검색|트렌드|경쟁|장단점/i,
      /\b(research|compare|summarize|analyze|sources?|pros\s*and\s*cons)\b/i,
    ],
  },
  {
    id: "writing",
    description: "글쓰기·이메일·카피·톤 맞춤 문장",
    instruction: `[스킬 · writing]
Context-first: 독자·목적·톤(격식/캐주얼)·분량을 먼저 맞춘다.
- 바로 붙여 쓸 수 있는 완성본을 제공한다.
- 한자 금지, 군더더기 문장 제거.
- 요청이 초안/여러 버전이면 짧은 옵션 2~3개.`,
    patterns: [
      /글\s*쓰|이메일|메일\s*초안|카피|문장|다듬|교정|번역(?!\s*기)|톤|어조|소개글|자기소개/i,
      /\b(write|rewrite|email|copy|draft|tone|proofread)\b/i,
    ],
  },
  {
    id: "tutoring",
    description: "학습·강의·문제 풀이·개념 설명",
    instruction: `[스킬 · tutoring]
Context-first: 학습자 수준·과목·목표(시험/개념이해)를 먼저 잡는다.
- 단계적으로 설명하고, 필요하면 확인 질문을 하나 둔다.
- 정답만 던지지 말고 풀이 과정을 보여 준다.
- 강의 노트·요약 요청이면 구조화된 노트로.`,
    patterns: [
      /강의|수업|공부|설명\s*해|개념|문제\s*풀|숙제|시험|수학|물리|화학|영어\s*문법|tutoring|explain/i,
      /\b(teach|tutor|homework|exam|concept|solve)\b/i,
    ],
  },
  {
    id: "docs",
    description: "PPT·문서·노트·과제물 구성 안내",
    instruction: `[스킬 · docs]
Context-first: 산출물 종류(PPT/워드/노트/과제)·분량·청중을 먼저 확인한다.
- 채팅에서는 긴 본문 대신 구성·아웃라인·핵심 문구를 우선 제시한다.
- 실제 파일 생성이 필요하면 전용 도구 경로를 안내하거나 짧게 유도한다.
- 슬라이드/섹션 제목은 구체적이고 중복 없게.`,
    patterns: [
      /ppt|파워포인트|슬라이드|발표\s*자료|노트\s*정리|과제|보고서|워드|엑셀|문서\s*작성|a4\s*노트/i,
      /\b(presentation|slides?|report|essay|worksheet|outline)\b/i,
    ],
  },
];

const MAX_PACKS = 2;

/** 배타 선택 금지 — 점수 상위 1~2개만 (동점이면 배열 순서). */
export function selectSkillPacks(text: string): SkillPack[] {
  const q = text.trim();
  if (!q) return [];

  const scored = SKILL_PACKS.map((pack) => {
    let score = 0;
    for (const re of pack.patterns) {
      if (re.test(q)) score += 1;
    }
    return { pack, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, MAX_PACKS).map((s) => s.pack);
}

export function formatSkillPackInstruction(packs: SkillPack[]): string {
  if (!packs.length) return "";
  return ["[활성 스킬팩 — 해당하는 지침만 적용]", ...packs.map((p) => p.instruction)].join(
    "\n\n",
  );
}

/**
 * 검색·생성·다도구가 필요한 멀티스텝 의도 → 에이전트 경로 승격 후보.
 * (명시적 agent 칩이 없어도 chat 라우트가 승격할 수 있음)
 */
export function shouldEscalateToAgent(text: string): boolean {
  const q = text.trim();
  if (!q || q.length < 12) return false;
  return (
    /찾아서\s*(만들어|작성|정리|요약)|검색(해서|한\s*다음).*(만들|작성|정리)|웹에서\s*찾아|최신\s*(뉴스|가격|정보).*(정리|요약|비교)|여러\s*도구|단계적으로\s*(조사|실행)/i.test(
      q,
    ) ||
    /\b(search\s+(and|then)\s+(write|create|summarize)|look\s+up\s+and\s+(draft|build))\b/i.test(q)
  );
}
