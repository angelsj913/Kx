/**
 * 일반 채팅 → 전용 파일/도구 경로 자동 연결.
 * "ppt 만들어줘" 를 글쓰기 에이전트 텍스트 초안으로 보내지 않는다.
 *
 * 패턴은 한국어·영어를 함께 검사한다(언어 설정을 조건으로 분기하지 않음) —
 * UI 언어와 무관하게 사용자가 실제로 입력한 문장에 반응해야 하고, 언어가
 * 섞여 쓰이는 경우(영문 UI에서 한국어 단어 등)에도 자연스럽게 걸려야 한다.
 */

const URL_RE_FOR_INTENT = /https?:\/\/[^\s<>"')\]]+/gi;

export function detectQuickToolFromText(text: string): string | null {
  const t = text.trim();
  if (!t) return null;

  // ── PPT 파일 (.pptx) ──
  const wantsPpt =
    /\b(ppt|pptx|powerpoint)\b/i.test(t) ||
    /파워\s*포인트|파워포인트/.test(t) ||
    /슬라이드\s*(자료|파일|덱|장|로|를|만들어|생성|작성|초안|로\s*만들)?/i.test(t) ||
    /프레젠테이션\s*(자료|파일|덱|만들어|생성|작성)?/i.test(t) ||
    /발표\s*(용\s*)?(자료|슬라이드|덱)/i.test(t) ||
    // "발표 해야 하는데 자료 만들어", "발표용으로 만들어줘"
    (/발표/.test(t) &&
      /(자료|슬라이드|덱|ppt)/i.test(t) &&
      /(만들|작성|생성|해\s*줘|해줘)/i.test(t)) ||
    // 영어: "make/create a presentation", "slides for...", "presentation deck"
    (/\bslides?\b|\bdeck\b|\bpresentation\b/i.test(t) &&
      /\b(make|create|build|generate|draft|need|prepare)\b/i.test(t));

  const wantsScriptOnly =
    (/발표\s*(문|대본|원고|스크립트)|스피치\s*원고|연설\s*원고/i.test(t) ||
      // 영어: "speech script/draft", "presentation script" (슬라이드 언급 없이 대본만)
      /\b(speech|presentation)\s*(script|draft|notes)\b/i.test(t)) &&
    !/\b(ppt|pptx|powerpoint|slides?|deck)\b/i.test(t) &&
    !/파워\s*포인트|파워포인트|슬라이드|발표\s*자료/i.test(t);

  if (wantsPpt && !wantsScriptOnly) return "ppt";
  if (wantsScriptOnly) return "presentation";

  // ── 엑셀 ──
  if (
    /\b(xlsx|excel|spreadsheet)\b/i.test(t) ||
    /엑셀|스프레드시트/.test(t) ||
    (/표\s*(로|를|자료)/.test(t) && /(만들|작성|생성)/.test(t)) ||
    // 영어: "make/create a table/spreadsheet"
    (/\btable\b/i.test(t) && /\b(make|create|build|generate)\b/i.test(t))
  ) {
    return "excel";
  }

  // ── 워드/문서 ──
  if (
    ((/\b(docx|word)\b/i.test(t) || /워드\s*문서|보고서\s*파일/.test(t)) &&
      /(만들|작성|생성|해\s*줘|해줘)/.test(t)) ||
    // 영어: "write/create a word document/report"
    (/\b(word\s*document|docx|report)\b/i.test(t) &&
      /\b(write|create|draft|make|generate)\b/i.test(t))
  ) {
    return "word-doc";
  }

  // ── 영상 요약 ──
  const hasYt = /https?:\/\/\S*(youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(t);
  const wantsVideoSummary =
    /영상\s*요약|동영상\s*요약|유튜브\s*요약|유튜브\s*정리|강의\s*요약|video\s*summar|유튜브.*요약|요약.*유튜브/i.test(
      t,
    ) ||
    // 영어: "summarize this video/lecture", "youtube summary"
    /\b(summarize|summary)\b.*\b(video|lecture|youtube)\b|\b(video|lecture|youtube)\b.*\b(summarize|summary)\b/i.test(
      t,
    ) ||
    (/요약|정리|노트|핵심|스크립트|대본|summarize|summary|notes|key\s*points/i.test(t) && hasYt) ||
    // YouTube URL 만 붙여넣은 경우도 요약 도구로
    (hasYt && t.replace(URL_RE_FOR_INTENT, "").trim().length < 40);
  if (wantsVideoSummary) return "video-summary";

  // ── A4 노트 ──
  if (
    /a4\s*노트|노트\s*정리|필기\s*정리|수업\s*노트/i.test(t) ||
    // 영어: "class/lecture notes", "note summary"
    /\b(class|lecture)\s*notes\b|\bnote\s*summary\b/i.test(t)
  ) {
    return "note-a4";
  }

  // ── 시험지 분석 / 유사도 (만들기에 앞서 판별) ──
  const examNoun = /시험지|문제지|답안지|시험\s*사진|\b(exam|test)\s*(paper|sheet|photo)/i.test(t);
  if (
    examNoun &&
    (/유사도|비슷한\s*(시험|문제)|비교/.test(t) ||
      /\b(similarit|compare|comparison)\b/i.test(t))
  ) {
    return "exam-similarity";
  }
  if (
    examNoun &&
    (/분석|채점|첨삭|피드백|틀린\s*문제/.test(t) ||
      /\b(analy[sz]e|analysis|grade|feedback)\b/i.test(t))
  ) {
    return "exam-analysis";
  }

  // ── 시험지 만들기 ──
  if (
    (/시험지|문제지|퀴즈/.test(t) && /(만들|작성|생성)/.test(t)) ||
    /모의고사|퀴즈\s*(만들|작성|생성)/i.test(t) ||
    // 영어: "practice exam/test", "quiz", "mock exam"
    /\b(practice\s*(exam|test)|mock\s*exam|quiz)\b/i.test(t)
  ) {
    return "exam-maker";
  }

  // ── 문서/텍스트 번역 ──
  const wantsTranslate =
    /번역\s*(해\s*줘|해줘|좀|부탁)?/.test(t) ||
    /\b(translate|translation)\b/i.test(t);
  if (wantsTranslate) return "doc-translate";

  // ── 수학 그래프 / 3D 도형 (이미지보다 먼저 — sin(x)/구 등이 그림으로 새지 않게) ──
  const hasEquationShape = /[a-zA-Z]\s*=\s*[^=]/.test(t) || /f\s*\(\s*x/i.test(t);
  // "함수" 단독은 "함수형 이미지" 등에 오탐하므로 그래프/그리기 단서와 함께일 때만
  const hasMathDrawCue =
    /그래프|방정식|좌표|곡선|곡면|sin\s*\(|cos\s*\(|tan\s*\(|sqrt\s*\(/i.test(t) ||
    /\b(plot|graph|equation|curve|surface)\b/i.test(t) ||
    (/함수/.test(t) && /(그래프|그려|시각화|좌표|방정식|plot|graph)/i.test(t)) ||
    (/\bfunction\b/i.test(t) && /\b(plot|graph|draw|visuali[sz]e)\b/i.test(t)) ||
    hasEquationShape;
  const wants3DExplicit = /\b3d\b/i.test(t) || /입체/.test(t) || /\bsolid\s*shape\b/i.test(t);
  // "공" 단독은 공포/공간 등과 겹치므로 제외. "구"는 한글 음절 경계로만.
  const solidShapeNoun =
    /삼각뿔|사각뿔|각뿔|피라미드|정육면체|육면체|직육면체|각기둥|원기둥|원뿔|정사면체|다면체|구체|도넛|토러스|(?<![가-힣])구(?![가-힣])/.test(
      t,
    ) ||
    /\b(pyramid|cube|cuboid|prism|cylinder|cone|tetrahedron|polyhedron|sphere|ball|torus|donut)\b/i.test(
      t,
    );
  const hasImageNoun =
    /그림|이미지|사진|삽화|일러스트(레이션)?|아이콘|로고|캐릭터|고양이|강아지|풍경|인물|포스터/.test(
      t,
    ) ||
    /\b(image|picture|photo|illustration|artwork|icon|logo|cat|dog|landscape|portrait|poster)\b/i.test(
      t,
    );
  const wantsDrawVerb =
    /그려\s*줘|그려\s*주세요|그려줘|그리기|시각화|표현해|만들어\s*줘|생성해/.test(t) ||
    /\b(plot|graph|visuali[sz]e|draw|make|create|generate|show)\b/i.test(t);
  const wantsGraph =
    /그래프/.test(t) ||
    /\b(plot|graph)\b/i.test(t) ||
    (hasMathDrawCue && wantsDrawVerb) ||
    (hasEquationShape && wantsDrawVerb) ||
    // 3D만으로 이미지 명사(고양이 3D 그려줘)를 훔치지 않음 — 입체 도형 명사/식과 함께일 때만
    (wants3DExplicit && solidShapeNoun && wantsDrawVerb) ||
    (wants3DExplicit && hasEquationShape) ||
    (solidShapeNoun && wantsDrawVerb && !hasImageNoun);
  if (wantsGraph) return "math-graph";

  // ── 이미지 생성 ──
  const wantsImageGen =
    (hasImageNoun && /(그려|만들|생성|디자인)/.test(t)) ||
    /\b(draw|generate|create|make)\b.*\b(image|picture|photo|illustration|artwork|icon|logo)\b/i.test(
      t,
    ) ||
    (/(그려\s*줘|그려\s*주세요|그려줘)/.test(t) &&
      !solidShapeNoun &&
      !hasMathDrawCue &&
      !hasEquationShape);
  if (wantsImageGen) return "image-gen";

  // ── 수학 풀이 ──
  // 뺄셈(-)은 날짜·전화번호·점수 표기와 겹쳐 오탐이 잦아 산술 패턴에서는 제외한다.
  const hasArithmeticShape =
    hasEquationShape ||
    (/=/.test(t) && /[a-zA-Z]/.test(t) && /\d/.test(t)) ||
    /\d+\s*[+*×÷/]\s*\d+/.test(t) ||
    /[a-zA-Z]\s*\^\s*\d/.test(t);
  const wantsSolveVerb =
    /풀어|풀이|구해|계산해|답\s*(은|이)?\s*(뭐|무엇)|얼마|몇\s*(이|인가|이야|야)/.test(t) ||
    /\b(solve|calculate|evaluate|compute)\b|\bwhat('?s|\s+is)\s+(the\s+)?answer\b|\bfind\s+[a-zA-Z]\b/i.test(
      t,
    );
  if (
    /수학\s*풀이|문제\s*풀어|방정식\s*풀/i.test(t) ||
    /\b(solve\s*this\s*equation|math\s*problem)\b/i.test(t) ||
    (hasArithmeticShape && wantsSolveVerb)
  ) {
    return "math-solve";
  }

  return null;
}

/** UI/로그용 라벨 */
export function toolIntentLabel(toolId: string): string {
  const map: Record<string, string> = {
    ppt: "PPT 파일 생성",
    excel: "엑셀 파일 생성",
    "word-doc": "문서 작성",
    bizdoc: "문서 작성",
    presentation: "발표문 작성",
    "video-summary": "영상 요약",
    lecture: "강의 영상 요약",
    "lecture-notes": "강의 노트",
    "lecture-chat": "강의 채팅",
    "note-a4": "A4 노트",
    "exam-maker": "시험지",
    "exam-analysis": "시험지 분석",
    "exam-similarity": "유사도 분석",
    "similar-problems": "유사문제 생성",
    "math-solve": "수학 풀이",
    "math-graph": "그래프 생성",
    "image-gen": "이미지 생성",
    "doc-translate": "문서 번역",
    "doc-convert": "문서 변환",
    "research-draft": "논문 초안",
    audio: "음성 정리",
    agent: "에이전트",
  };
  return map[toolId] ?? toolId;
}
