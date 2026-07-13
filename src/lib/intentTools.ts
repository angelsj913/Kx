/**
 * 일반 채팅 문장에서 파일/전용 도구 의도를 감지한다.
 * 사이드바 퀵툴을 고르지 않아도 "ppt 만들어줘" → 실제 .pptx 생성 경로로 보낸다.
 */

/** 명시적 퀵툴이 없을 때 텍스트로 toolId 추론 */
export function detectQuickToolFromText(text: string): string | null {
  const t = text.trim();
  if (!t) return null;

  // ── PPT / 슬라이드 파일 (발표 대본보다 우선) ──
  const mentionsPptFile =
    /\b(ppt|pptx|powerpoint)\b/i.test(t) ||
    /파워\s*포인트|파워포인트/.test(t) ||
    /슬라이드\s*(자료|파일|덱|장|로|를|만들어|생성|작성|초안)?/i.test(t) ||
    /프레젠테이션\s*(자료|파일|덱|만들어|생성|작성)?/i.test(t) ||
    /발표\s*(용\s*)?(자료|슬라이드|덱|ppt)/i.test(t);

  const wantsScriptOnly =
    /발표\s*(문|대본|원고|스크립트)|스피치\s*원고|연설\s*원고/i.test(t) &&
    !/\b(ppt|pptx|powerpoint)\b/i.test(t) &&
    !/파워\s*포인트|파워포인트|슬라이드|프레젠테이션\s*파일/i.test(t);

  if (mentionsPptFile && !wantsScriptOnly) return "ppt";
  if (wantsScriptOnly) return "presentation";

  // ── 엑셀 ──
  if (
    /\b(xlsx|excel)\b/i.test(t) ||
    /엑셀|스프레드시트|표\s*(자료|파일)?\s*(만들|작성|생성)/i.test(t)
  ) {
    return "excel";
  }

  // ── 영상 요약 ──
  if (
    /영상\s*요약|유튜브\s*요약|강의\s*요약|video\s*summar/i.test(t) ||
    (/요약/.test(t) && /https?:\/\/\S*(youtube|youtu\.be)/i.test(t))
  ) {
    return "video-summary";
  }

  // ── A4 노트 ──
  if (/a4\s*노트|노트\s*정리|필기\s*정리|수업\s*노트/i.test(t)) {
    return "note-a4";
  }

  // ── 시험지 ──
  if (/시험지|문제지|퀴즈\s*(만들|작성|생성)|모의고사/i.test(t)) {
    return "exam-maker";
  }

  // ── 수학 풀이 ──
  if (/수학\s*풀이|문제\s*풀어|방정식\s*풀/i.test(t)) {
    return "math-solve";
  }

  return null;
}
