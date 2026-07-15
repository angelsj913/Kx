/**
 * 일반 채팅 → 전용 파일/도구 경로 자동 연결.
 * "ppt 만들어줘" 를 글쓰기 에이전트 텍스트 초안으로 보내지 않는다.
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
      /(만들|작성|생성|해\s*줘|해줘)/i.test(t));

  const wantsScriptOnly =
    /발표\s*(문|대본|원고|스크립트)|스피치\s*원고|연설\s*원고/i.test(t) &&
    !/\b(ppt|pptx|powerpoint)\b/i.test(t) &&
    !/파워\s*포인트|파워포인트|슬라이드|발표\s*자료/i.test(t);

  if (wantsPpt && !wantsScriptOnly) return "ppt";
  if (wantsScriptOnly) return "presentation";

  // ── 엑셀 ──
  if (
    /\b(xlsx|excel)\b/i.test(t) ||
    /엑셀|스프레드시트/.test(t) ||
    (/표\s*(로|를|자료)/.test(t) && /(만들|작성|생성)/.test(t))
  ) {
    return "excel";
  }

  // ── 워드/문서 ──
  if (
    (/\b(docx|word)\b/i.test(t) || /워드\s*문서|보고서\s*파일/.test(t)) &&
    /(만들|작성|생성|해\s*줘|해줘)/.test(t)
  ) {
    return "word-doc";
  }

  // ── 영상 요약 ──
  const hasYt = /https?:\/\/\S*(youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(t);
  const wantsVideoSummary =
    /영상\s*요약|동영상\s*요약|유튜브\s*요약|유튜브\s*정리|강의\s*요약|video\s*summar|유튜브.*요약|요약.*유튜브/i.test(
      t,
    ) ||
    (/요약|정리|노트|핵심|스크립트|대본/.test(t) && hasYt) ||
    // YouTube URL 만 붙여넣은 경우도 요약 도구로
    (hasYt && t.replace(URL_RE_FOR_INTENT, "").trim().length < 40);
  if (wantsVideoSummary) return "video-summary";

  // ── A4 노트 ──
  if (/a4\s*노트|노트\s*정리|필기\s*정리|수업\s*노트/i.test(t)) {
    return "note-a4";
  }

  // ── 시험지 ──
  if (/시험지|문제지|퀴즈\s*(만들|작성|생성)|모의고사/i.test(t)) {
    return "exam-maker";
  }

  // ── 수학 그래프 (그래프 요청이 더 구체적이므로 수학 풀이보다 먼저 판별) ──
  const hasEquationShape = /[a-zA-Z]\s*=\s*[^=]/.test(t) || /f\s*\(\s*x/i.test(t);
  const wantsGraph =
    /그래프|그려\s*줘|그려\s*주세요|그리기|시각화/.test(t) ||
    /\b(plot|graph)\b/i.test(t) ||
    (hasEquationShape && /(그려|시각화|보여)/.test(t));
  if (wantsGraph) return "math-graph";

  // ── 수학 ──
  if (/수학\s*풀이|문제\s*풀어|방정식\s*풀/i.test(t)) {
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
    presentation: "발표문 작성",
    "video-summary": "영상 요약",
    "note-a4": "A4 노트",
    "exam-maker": "시험지",
    "math-solve": "수학 풀이",
    "math-graph": "그래프 생성",
  };
  return map[toolId] ?? toolId;
}
