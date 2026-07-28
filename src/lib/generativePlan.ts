import type { GenerationSkill, GenerativeRouteDecision } from "@/lib/generativeRouter";
import type { GenerativeBudget } from "@/lib/generativeBudgets";
import type { EvidenceBundle } from "@/lib/ragEvidenceItems";

export type GenerativeOutlineSection = {
  id: string;
  title: string;
  queryHint: string;
};

export function planOutline(
  skill: GenerationSkill,
  query: string,
  maxSections: number,
): GenerativeOutlineSection[] {
  const cap = Math.max(1, maxSections);

  if (skill === "presentation") {
    return [
      { id: "intro", title: "도입", queryHint: `${query} 개요 배경` },
      { id: "body", title: "핵심 내용", queryHint: `${query} 핵심 논점` },
      { id: "closing", title: "결론", queryHint: `${query} 결론 시사점` },
    ].slice(0, cap);
  }

  if (skill === "study") {
    return [
      { id: "summary", title: "핵심 요약", queryHint: `${query} 핵심 개념 요약` },
      { id: "review", title: "복습 포인트", queryHint: `${query} 시험 대비 포인트` },
      { id: "practice", title: "연습", queryHint: `${query} 연습 문제 아이디어` },
    ].slice(0, cap);
  }

  return [
    { id: "intro", title: "서론", queryHint: `${query} 배경과 목적` },
    { id: "analysis", title: "본론", queryHint: `${query} 핵심 분석` },
    { id: "conclusion", title: "결론", queryHint: `${query} 결론과 시사점` },
  ].slice(0, cap);
}

export function mergeSectionBodies(sections: Array<{ title: string; body: string }>): string {
  return sections.map((s) => `## ${s.title}\n\n${s.body}`).join("\n\n");
}

export type AgenticDraft = {
  summary: string;
  body: string;
  sections: Array<{ title: string; body: string }>;
};
