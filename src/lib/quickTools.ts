import { TOOLS, type ToolDef } from "./tools";

/** 채팅 "+" 기능 목록 — 카테고리별 */
export const FEATURE_GROUPS: {
  id: string;
  label: string;
  toolIds: string[];
}[] = [
  {
    id: "agent",
    label: "에이전트",
    toolIds: ["agent"],
  },
  {
    id: "create",
    label: "문서 · 파일",
    toolIds: ["bizdoc", "word-doc", "ppt", "excel", "doc-convert", "note-a4", "image-gen", "image-upscale", "doc-translate"],
  },
  {
    id: "learn",
    label: "학습 · 시험",
    toolIds: [
      "video-summary",
      "lecture",
      "lecture-notes",
      "math-solve",
      "math-graph",
      "exam-analysis",
      "exam-similarity",
      "similar-problems",
      "exam-maker",
      "presentation",
      "research-draft",
    ],
  },
  {
    id: "media",
    label: "음성 · 강의",
    toolIds: ["audio", "lecture-chat"],
  },
];

/** 채팅 입력창 "+" 팝업에 노출되는 퀵툴 id 전체 */
export const QUICK_TOOL_IDS = FEATURE_GROUPS.flatMap((g) => g.toolIds);

export const QUICK_TOOLS: ToolDef[] = TOOLS.filter((t) => QUICK_TOOL_IDS.includes(t.id));

export function isQuickToolEnabled(enabledQuickTools: string[], id: string): boolean {
  return enabledQuickTools.length === 0 || enabledQuickTools.includes(id);
}

export function groupedQuickTools(enabledQuickTools: string[] = []) {
  return FEATURE_GROUPS.map((g) => ({
    ...g,
    tools: QUICK_TOOLS.filter(
      (t) => g.toolIds.includes(t.id) && isQuickToolEnabled(enabledQuickTools, t.id),
    ),
  })).filter((g) => g.tools.length > 0);
}
