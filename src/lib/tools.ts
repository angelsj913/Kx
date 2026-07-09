import type { LucideIcon } from "lucide-react";
import {
  Mail,
  Presentation,
  Table2,
  Video,
  Mic,
  FileText,
  MessagesSquare,
  ClipboardList,
  BarChart3,
  NotebookText,
  BookMarked,
} from "lucide-react";
import type { StructuredKind } from "./structured";

export type AppMode = "student" | "office";
/** 도구가 속한 모드. "common"은 두 모드 모두에 노출된다. */
export type ToolScope = AppMode | "common";
export type InputType = "text" | "url" | "audio" | "chat";
export type OutputType = "markdown" | "pptx" | "xlsx" | "structured";

export interface ToolDef {
  /** 안정적인 고유 식별자 (히스토리 저장에도 사용) */
  id: string;
  appMode: ToolScope;
  /** 사이드바 메뉴 라벨 */
  label: string;
  /** 히스토리 칩 등 짧은 라벨 */
  short: string;
  /** 작업 화면 제목 */
  title: string;
  description: string;
  icon: LucideIcon;
  inputType: InputType;
  outputType: OutputType;
  /** outputType이 "structured"일 때 어떤 구조화 뷰로 렌더링할지 */
  structuredKind?: StructuredKind;
  /** Gemini system instruction */
  systemInstruction: string;
  placeholder: string;
  /** 실행 버튼 문구 */
  submitLabel: string;
  /** 파일 저장 시 기본 이름 */
  fileBaseName: string;
}

const PPT_INSTRUCTION = `너는 대기업 기획팀의 프레젠테이션 전문가이다. 사용자가 발표 주제나 개요를 입력하면, 실제 발표에 바로 쓸 수 있는 PPT 초안 구조를 설계해야 한다.

반드시 아래 JSON 형식으로만 응답하라. 다른 설명이나 마크다운, 코드블록 표시(\`\`\`) 없이 순수 JSON 객체 하나만 출력한다.

{
  "title": "발표 전체 제목",
  "slides": [
    { "title": "슬라이드 제목", "bullets": ["핵심 요점 문장", "핵심 요점 문장"], "notes": "발표자가 말할 대본 한두 문장" }
  ]
}

지침:
- 표지는 자동으로 생성되므로 slides 배열에는 본문 슬라이드만 6~9장 넣어라(목차·본론·마무리 흐름).
- 각 슬라이드의 bullets는 2~5개, 한 문장씩 간결하게.
- notes에는 발표자가 실제로 말할 스크립트를 자연스러운 구어체로 넣어라.
- 모든 텍스트는 한국어로 작성한다.`;

const EXCEL_INSTRUCTION = `너는 대기업 사무 전문가이다. 사용자가 원하는 보고서/표 요구사항을 입력하면, 엑셀로 바로 저장할 수 있는 표 데이터를 설계해야 한다.

반드시 아래 JSON 형식으로만 응답하라. 다른 설명이나 마크다운, 코드블록 표시(\`\`\`) 없이 순수 JSON 객체 하나만 출력한다.

{
  "title": "보고서 제목",
  "sheets": [
    {
      "name": "시트 이름",
      "columns": ["열 제목1", "열 제목2", "열 제목3"],
      "rows": [
        ["1행 값1", "1행 값2", "1행 값3"],
        ["2행 값1", "2행 값2", "2행 값3"]
      ]
    }
  ]
}

지침:
- columns의 개수와 각 row의 값 개수는 반드시 일치시켜라.
- 요구사항에 맞는 현실적인 예시 데이터로 표를 채워라(빈 표를 만들지 말 것).
- 숫자 데이터는 문자열이 아닌 숫자로 넣어도 된다.
- 여러 관점이 필요하면 시트를 여러 개로 나눠라.
- 모든 텍스트는 한국어로 작성한다.`;

const BIZDOC_INSTRUCTION = `너는 15년 차 시니어 비즈니스 컨설턴트이다. 사용자가 전하려는 요지나 두서없는 초안을 입력하면, 이메일·슬랙·보고 상황에 바로 쓸 수 있는 정중하고 세련된 비즈니스 문서로 완성해야 한다.

[출력 포맷 지침]
- 마크다운 문법(제목, 굵게, 목록)을 활용해 깔끔하게 구조화하라.
- 상황에 따라 고를 수 있도록 두 가지 버전으로 나눠 출력하라.
  - **[버전 1: 정중하고 공식적인 톤]**
  - **[버전 2: 부드럽고 유연한 실무 톤]**
- 각 버전 하단에 어떤 표현을 왜 다듬었는지 '핵심 포인트' 한 줄을 덧붙여라.`;

const PRESENTATION_INSTRUCTION = `너는 학생들의 글쓰기를 돕는 친절한 국어 선생님이자 발표 코치이다. 사용자가 발표나 과제 주제를 입력하면, 학생이 그대로 읽거나 제출할 수 있는 완성된 글을 써줘야 한다.

[출력 포맷 지침]
- 마크다운 문법(제목, 굵게, 목록)을 활용해 구조화하라.
- 서론·본론·결론이 드러나는 발표 대본 형태로 작성하라.
- 너무 어렵지 않고 또박또박 말하기 좋은 문장으로 쓰되, 핵심 근거와 예시를 포함하라.
- 마지막에 '발표 팁' 두세 가지를 덧붙여라.`;

const LECTURE_INSTRUCTION = `너는 학생의 학습을 돕는 유능한 조교이다. 제공된 강의 영상의 내용을 분석해 학생이 복습하기 좋게 정리해야 한다.

[출력 포맷 지침]
- 마크다운 문법(제목, 굵게, 목록)을 활용해 구조화하라.
- 다음 순서로 정리하라.
  1. **한 줄 요약**: 영상의 핵심 주제를 한 문장으로.
  2. **핵심 내용 정리**: 중요한 개념과 설명을 항목별로 정리.
  3. **꼭 기억할 포인트**: 시험이나 복습에 중요한 부분을 강조.
  4. **예상 질문**: 이해도를 점검할 수 있는 질문 2~3개.
- 모든 내용은 한국어로 작성한다.`;

const AUDIO_INSTRUCTION = `너는 학생의 학습을 돕는 유능한 조교이다. 제공된 수업/강의 녹음 오디오를 듣고, 학생이 복습하기 좋게 필기 형태로 정리해야 한다.

[출력 포맷 지침]
- 마크다운 문법(제목, 굵게, 목록)을 활용해 구조화하라.
- 다음 순서로 정리하라.
  1. **한 줄 요약**: 수업의 핵심 주제를 한 문장으로.
  2. **필기 정리**: 선생님이 설명한 내용을 항목별 노트 형태로.
  3. **꼭 기억할 포인트**: 강조되었거나 시험에 나올 만한 부분.
  4. **모르면 다시 들어볼 부분**: 애매하게 들린 구간이 있으면 표시.
- 들리지 않는 부분은 추측하지 말고 '불명확'으로 표시하라.
- 모든 내용은 한국어로 작성한다.`;

const MEETING_INSTRUCTION = `너는 유능한 회의 서기이다. 사용자가 회의 중 메모하거나 회의 후 기억나는 대로 적은 두서없는 내용을 입력하면, 정식 회의록으로 구조화해야 한다.

반드시 아래 JSON 형식으로만 응답하라. 다른 설명이나 마크다운, 코드블록 표시(\`\`\`) 없이 순수 JSON 객체 하나만 출력한다.

{
  "date": "회의 날짜(입력에 없으면 빈 문자열)",
  "attendees": ["참석자1", "참석자2"],
  "agenda": "이번 회의의 주제/목적 한두 문장",
  "actionItems": [
    { "task": "해야 할 일", "assignee": "담당자(입력에 없으면 빈 문자열)", "dueDate": "기한(입력에 없으면 빈 문자열, YYYY-MM-DD 형식 권장)" }
  ]
}

지침:
- 입력에서 참석자/날짜/기한을 명시적으로 알 수 없으면 추측하지 말고 빈 값으로 둔다.
- actionItems는 회의에서 논의된 실제 후속 조치만 포함하고, 없으면 빈 배열로 둔다.
- 모든 텍스트는 한국어로 작성한다.`;

const WEEKLY_REPORT_INSTRUCTION = `너는 대기업 팀의 업무 보고 정리 전문가이다. 사용자가 이번 주에 한 일과 다음 주 계획을 두서없이 입력하면, 주간 업무 보고 형식으로 구조화해야 한다.

반드시 아래 JSON 형식으로만 응답하라. 다른 설명이나 마크다운, 코드블록 표시(\`\`\`) 없이 순수 JSON 객체 하나만 출력한다.

{
  "thisWeek": [ { "item": "이번 주 진행한 업무", "progress": 0-100 사이 숫자(완료율 추정) } ],
  "nextWeek": [ { "item": "다음 주 진행할 업무", "progress": 0 } ]
}

지침:
- thisWeek 항목의 progress는 입력 내용을 근거로 합리적으로 추정하되(완료라고 명시되면 100, 진행 중이면 40~70 사이 등), 사용자가 나중에 직접 조정할 수 있는 초기값일 뿐이다.
- nextWeek 항목은 아직 시작 전이므로 progress는 항상 0으로 둔다.
- 항목은 각각 한 문장으로 간결하게 작성한다.
- 모든 텍스트는 한국어로 작성한다.`;

const LECTURE_NOTES_INSTRUCTION = `너는 학생의 능동 회상(active recall) 학습을 돕는 유능한 조교이다. 사용자가 강의 필기나 수업 내용을 입력하면, 복습하기 좋은 노트 형태로 재구성해야 한다.

반드시 아래 JSON 형식으로만 응답하라. 다른 설명이나 마크다운, 코드블록 표시(\`\`\`) 없이 순수 JSON 객체 하나만 출력한다.

{
  "concepts": [ { "cue": "핵심 키워드/질문(짧게)", "detail": "해당 개념에 대한 상세 설명" } ],
  "transcript": "정리된 강의 내용 전체(문단 형태)",
  "summaryLines": ["요약 문장 1", "요약 문장 2", "요약 문장 3"]
}

지침:
- concepts는 나중에 키워드만 보고 내용을 떠올리는 능동 회상 연습용이므로, cue는 짧고 detail은 충분히 설명적으로 작성한다.
- summaryLines는 정확히 3개의 문장으로, 강의 전체를 압축한 핵심 요약이어야 한다.
- 모든 내용은 한국어로 작성한다.`;

const RESEARCH_DRAFT_INSTRUCTION = `너는 학생의 레포트·논문 작성을 돕는 유능한 지도교수이다. 사용자가 주제나 개요를 입력하면, 초안 구조를 섹션별로 설계해야 한다.

반드시 아래 JSON 형식으로만 응답하라. 다른 설명이나 마크다운, 코드블록 표시(\`\`\`) 없이 순수 JSON 객체 하나만 출력한다.

{
  "sections": [ { "heading": "섹션 제목(예: 서론, 이론적 배경, 본론1, 결론)", "body": "해당 섹션의 초안 내용(문단 형태)" } ],
  "citations": [ { "source": "출처/자료명", "author": "저자(모르면 빈 문자열)", "note": "이 자료를 어디에 참고했는지 한 줄 메모" } ]
}

지침:
- sections는 서론부터 결론까지 4~6개 섹션으로 구성한다.
- citations는 본문 내용과 관련해 사용자가 실제로 찾아 보강해야 할 자료를 제안하는 용도이며, 확실하지 않은 저자명은 빈 문자열로 둔다.
- 모든 텍스트는 한국어로 작성한다.`;

export const TOOLS: ToolDef[] = [
  // ── 공통 ──
  {
    id: "chat",
    appMode: "common",
    label: "AI 채팅",
    short: "AI 채팅",
    title: "AI 채팅",
    description:
      "여러 AI와 자유롭게 대화하세요. 이미지나 문서를 첨부해 질문할 수 있고, 원하는 AI 모델과 성격(페르소나)을 골라 쓸 수 있습니다.",
    icon: MessagesSquare,
    inputType: "chat",
    outputType: "markdown",
    systemInstruction: "",
    placeholder: "무엇이든 물어보세요...",
    submitLabel: "보내기",
    fileBaseName: "chat",
  },
  // ── 직장인 모드 ──
  {
    id: "bizdoc",
    appMode: "office",
    label: "비즈니스 문서 작성",
    short: "비즈니스 문서",
    title: "비즈니스 문서·이메일 작성",
    description:
      "전하려는 요지만 적으면 이메일·슬랙·보고에 바로 쓸 수 있는 정중한 비즈니스 문서 2가지 버전으로 완성합니다.",
    icon: Mail,
    inputType: "text",
    outputType: "markdown",
    systemInstruction: BIZDOC_INSTRUCTION,
    placeholder:
      "예) 이번 주까지 하기로 한 자료가 늦어질 것 같다고 팀장님께 양해를 구하고 싶어요.",
    submitLabel: "문서 작성하기",
    fileBaseName: "business-doc",
  },
  {
    id: "ppt",
    appMode: "office",
    label: "PPT 초안 작성",
    short: "PPT 초안",
    title: "PPT 초안 작성",
    description:
      "발표 주제와 개요를 입력하면 표지부터 마무리까지 슬라이드 구성을 설계하고, 실제 PPT 파일로 내려받을 수 있습니다.",
    icon: Presentation,
    inputType: "text",
    outputType: "pptx",
    systemInstruction: PPT_INSTRUCTION,
    placeholder:
      "예) 신제품 출시 전략 발표. 시장 현황, 타깃 고객, 마케팅 계획, 예상 매출을 포함해줘.",
    submitLabel: "PPT 초안 만들기",
    fileBaseName: "presentation",
  },
  {
    id: "excel",
    appMode: "office",
    label: "엑셀 보고서 작성",
    short: "엑셀 보고서",
    title: "엑셀 보고서 작성",
    description:
      "필요한 표의 요구사항을 입력하면 항목과 예시 데이터를 채워 실제 엑셀(.xlsx) 파일로 내려받을 수 있습니다.",
    icon: Table2,
    inputType: "text",
    outputType: "xlsx",
    systemInstruction: EXCEL_INSTRUCTION,
    placeholder:
      "예) 상반기 팀별 지출 내역 보고서. 팀명, 항목, 금액, 비고 열로 정리해줘.",
    submitLabel: "엑셀 보고서 만들기",
    fileBaseName: "report",
  },
  {
    id: "meeting",
    appMode: "office",
    label: "회의록",
    short: "회의록",
    title: "회의록 작성",
    description:
      "회의 중 메모하거나 기억나는 대로 적은 내용을 입력하면, 날짜·참석자·안건과 담당자·기한이 달린 액션 아이템까지 정리된 회의록으로 완성합니다.",
    icon: ClipboardList,
    inputType: "text",
    outputType: "structured",
    structuredKind: "meeting",
    systemInstruction: MEETING_INSTRUCTION,
    placeholder:
      "예) 오늘 마케팅팀 회의. 김민준, 이서연, 박지훈 참석. 다음 캠페인 예산이랑 일정 논의함. 민준이 예산안 금요일까지, 서연이 시안 다음주 수요일까지 준비하기로 함.",
    submitLabel: "회의록 만들기",
    fileBaseName: "meeting-minutes",
  },
  {
    id: "weekly-report",
    appMode: "office",
    label: "주간 업무 보고",
    short: "주간 보고",
    title: "주간 업무 보고",
    description:
      "이번 주에 한 일과 다음 주 계획을 두서없이 입력하면, 진행률 슬라이더로 직접 조정할 수 있는 주간 업무 보고 형식으로 정리합니다.",
    icon: BarChart3,
    inputType: "text",
    outputType: "structured",
    structuredKind: "weeklyReport",
    systemInstruction: WEEKLY_REPORT_INSTRUCTION,
    placeholder:
      "예) 이번 주엔 신규 랜딩페이지 디자인 시안 작업 거의 다 끝냈고, 고객사 미팅 준비도 했음. 다음 주엔 개발팀 전달하고 QA 진행 예정.",
    submitLabel: "주간 보고 만들기",
    fileBaseName: "weekly-report",
  },
  // ── 학생 모드 ──
  {
    id: "lecture",
    appMode: "student",
    label: "강의 영상 요약",
    short: "강의 요약",
    title: "강의 영상 요약",
    description:
      "강의 영상(YouTube) 주소를 붙여넣으면 핵심 내용과 복습 포인트, 예상 질문까지 자동으로 정리합니다.",
    icon: Video,
    inputType: "url",
    outputType: "markdown",
    systemInstruction: LECTURE_INSTRUCTION,
    placeholder: "예) https://www.youtube.com/watch?v=...",
    submitLabel: "영상 요약하기",
    fileBaseName: "lecture-summary",
  },
  {
    id: "audio",
    appMode: "student",
    label: "수업 음성 정리",
    short: "수업 정리",
    title: "수업 음성 정리",
    description:
      "수업이나 강의를 녹음하거나 오디오 파일을 올리면, 선생님의 설명을 필기 형태로 자동 정리합니다.",
    icon: Mic,
    inputType: "audio",
    outputType: "markdown",
    systemInstruction: AUDIO_INSTRUCTION,
    placeholder: "",
    submitLabel: "음성 정리하기",
    fileBaseName: "class-notes",
  },
  {
    id: "presentation",
    appMode: "student",
    label: "발표문·과제 작성",
    short: "발표문",
    title: "발표문·과제 작성",
    description:
      "주제만 입력하면 서론·본론·결론이 갖춰진 발표 대본과 발표 팁을 완성해 그대로 활용할 수 있습니다.",
    icon: FileText,
    inputType: "text",
    outputType: "markdown",
    systemInstruction: PRESENTATION_INSTRUCTION,
    placeholder:
      "예) '환경 보호를 위한 우리의 실천'이라는 주제로 5분 발표문을 써줘.",
    submitLabel: "발표문 작성하기",
    fileBaseName: "presentation-script",
  },
  {
    id: "lecture-notes",
    appMode: "student",
    label: "강의 요약 노트",
    short: "강의 노트",
    title: "강의 요약 노트",
    description:
      "강의 필기나 수업 내용을 입력하면, 키워드로 떠올리는 능동 회상 노트와 3줄 요약이 갖춰진 복습용 노트로 정리합니다.",
    icon: NotebookText,
    inputType: "text",
    outputType: "structured",
    structuredKind: "lectureNotes",
    systemInstruction: LECTURE_NOTES_INSTRUCTION,
    placeholder:
      "예) 오늘 배운 미시경제 수요공급 이론 필기 붙여넣기...",
    submitLabel: "노트 만들기",
    fileBaseName: "lecture-notes",
  },
  {
    id: "research-draft",
    appMode: "student",
    label: "레포트·논문 초안",
    short: "레포트 초안",
    title: "레포트 · 논문 초안",
    description:
      "주제나 개요만 입력하면 서론부터 결론까지 섹션별 초안과 참고자료 목록이 갖춰진 레포트 초안을 완성합니다.",
    icon: BookMarked,
    inputType: "text",
    outputType: "structured",
    structuredKind: "researchDraft",
    systemInstruction: RESEARCH_DRAFT_INSTRUCTION,
    placeholder:
      "예) '기후변화가 국내 농업에 미치는 영향'을 주제로 한 레포트 초안을 써줘.",
    submitLabel: "초안 만들기",
    fileBaseName: "research-draft",
  },
];

export function toolsForMode(mode: AppMode): ToolDef[] {
  return TOOLS.filter((t) => t.appMode === mode || t.appMode === "common");
}

export function getTool(id: string): ToolDef | undefined {
  return TOOLS.find((t) => t.id === id);
}
