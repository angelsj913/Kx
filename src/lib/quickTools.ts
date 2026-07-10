import { Mail, Presentation, Table2, Video, FileText, BookMarked, type LucideIcon } from "lucide-react";

export type QuickToolGroup = "office" | "student";

export interface QuickTool {
  id: string;
  group: QuickToolGroup;
  icon: LucideIcon;
  labelKey: string;
  /** 클릭 시 채팅 입력창에 미리 채워 넣는 프롬프트 템플릿. 사용자가 이어서 완성해 전송한다. */
  promptTemplate: string;
}

/** 채팅 입력창의 "기능 추가" 메뉴 + 설정 > 기능 탭에서 함께 쓰는 퀵툴 6종.
 * 실제 문서/PPT/엑셀 파일 생성 파이프라인이 아니라, 해당 작업에 맞는 프롬프트를
 * 미리 채워주는 시작점이다 — 전송된 메시지는 /api/chat의 멀티 에이전트가 처리한다. */
export const QUICK_TOOLS: QuickTool[] = [
  { id: "bizdoc", group: "office", icon: Mail, labelKey: "tool.bizdoc", promptTemplate: "다음 내용을 바탕으로 정중한 비즈니스 문서를 작성해줘: " },
  { id: "ppt", group: "office", icon: Presentation, labelKey: "tool.ppt", promptTemplate: "다음 주제로 발표용 슬라이드 구성안을 만들어줘: " },
  { id: "excel", group: "office", icon: Table2, labelKey: "tool.excel", promptTemplate: "다음 요구사항에 맞는 표를 만들어줘: " },
  { id: "lecture", group: "student", icon: Video, labelKey: "tool.lecture", promptTemplate: "다음 강의 영상 내용을 핵심 위주로 요약해줘: " },
  { id: "assignment", group: "student", icon: FileText, labelKey: "tool.assignment", promptTemplate: "다음 주제로 과제를 작성해줘: " },
  { id: "paper", group: "student", icon: BookMarked, labelKey: "tool.paper", promptTemplate: "다음 주제로 논문 초안을 작성해줘: " },
];

export function getQuickTool(id: string): QuickTool | undefined {
  return QUICK_TOOLS.find((t) => t.id === id);
}
