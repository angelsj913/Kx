import { TOOLS, type ToolDef } from "./tools";

/** 채팅 입력창 "+" 팝업에 노출되는 퀵툴 6종 (직장인 3 + 학생 3). */
export const QUICK_TOOL_IDS = ["bizdoc", "ppt", "excel", "lecture", "presentation", "research-draft"];

export const QUICK_TOOLS: ToolDef[] = TOOLS.filter((t) => QUICK_TOOL_IDS.includes(t.id));

export function isQuickToolEnabled(enabledQuickTools: string[], id: string): boolean {
  return enabledQuickTools.length === 0 || enabledQuickTools.includes(id);
}
