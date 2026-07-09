// 신규 구조화 도구(회의록/주간보고/강의노트/레포트 초안)의 데이터 타입 + AI 응답 파싱.
// pptx.ts/xlsx.ts와 동일한 패턴: extractJson으로 코드블록을 벗기고 JSON.parse.

import { extractJson } from "./fileTypes";

export type StructuredKind =
  | "meeting"
  | "weeklyReport"
  | "lectureNotes"
  | "researchDraft";

// ── 회의록 ──

export interface ActionItem {
  task: string;
  assignee: string;
  dueDate: string;
}

export interface MeetingMinutes {
  date: string;
  attendees: string[];
  agenda: string;
  actionItems: ActionItem[];
}

export function parseMeetingMinutes(raw: string): MeetingMinutes {
  const obj = JSON.parse(extractJson(raw));
  return {
    date: typeof obj?.date === "string" ? obj.date : "",
    attendees: Array.isArray(obj?.attendees)
      ? (obj.attendees as unknown[]).map((a) => String(a))
      : [],
    agenda: typeof obj?.agenda === "string" ? obj.agenda : "",
    actionItems: Array.isArray(obj?.actionItems)
      ? (obj.actionItems as unknown[]).map((a) => {
          const item = a as Record<string, unknown>;
          return {
            task: typeof item?.task === "string" ? item.task : "",
            assignee: typeof item?.assignee === "string" ? item.assignee : "",
            dueDate: typeof item?.dueDate === "string" ? item.dueDate : "",
          };
        })
      : [],
  };
}

// ── 주간 업무 보고 ──

export interface WeeklyReportItem {
  item: string;
  progress: number; // 0-100
}

export interface WeeklyReport {
  thisWeek: WeeklyReportItem[];
  nextWeek: WeeklyReportItem[];
}

function toItems(v: unknown): WeeklyReportItem[] {
  if (!Array.isArray(v)) return [];
  return (v as unknown[]).map((x) => {
    const o = x as Record<string, unknown>;
    const progress = typeof o?.progress === "number" ? o.progress : Number(o?.progress);
    return {
      item: typeof o?.item === "string" ? o.item : "",
      progress: Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0,
    };
  });
}

export function parseWeeklyReport(raw: string): WeeklyReport {
  const obj = JSON.parse(extractJson(raw));
  return {
    thisWeek: toItems(obj?.thisWeek),
    nextWeek: toItems(obj?.nextWeek),
  };
}

// ── 강의 요약 노트 ──

export interface LectureConcept {
  cue: string;
  detail: string;
}

export interface LectureNotes {
  concepts: LectureConcept[];
  transcript: string;
  summaryLines: string[];
}

export function parseLectureNotes(raw: string): LectureNotes {
  const obj = JSON.parse(extractJson(raw));
  return {
    concepts: Array.isArray(obj?.concepts)
      ? (obj.concepts as unknown[]).map((c) => {
          const o = c as Record<string, unknown>;
          return {
            cue: typeof o?.cue === "string" ? o.cue : "",
            detail: typeof o?.detail === "string" ? o.detail : "",
          };
        })
      : [],
    transcript: typeof obj?.transcript === "string" ? obj.transcript : "",
    summaryLines: Array.isArray(obj?.summaryLines)
      ? (obj.summaryLines as unknown[]).map((s) => String(s)).slice(0, 3)
      : [],
  };
}

// ── 레포트 / 논문 초안 ──

export interface ResearchSection {
  heading: string;
  body: string;
}

export interface Citation {
  source: string;
  author: string;
  note: string;
}

export interface ResearchDraft {
  sections: ResearchSection[];
  citations: Citation[];
}

export function parseResearchDraft(raw: string): ResearchDraft {
  const obj = JSON.parse(extractJson(raw));
  return {
    sections: Array.isArray(obj?.sections)
      ? (obj.sections as unknown[]).map((s) => {
          const o = s as Record<string, unknown>;
          return {
            heading: typeof o?.heading === "string" ? o.heading : "",
            body: typeof o?.body === "string" ? o.body : "",
          };
        })
      : [],
    citations: Array.isArray(obj?.citations)
      ? (obj.citations as unknown[]).map((c) => {
          const o = c as Record<string, unknown>;
          return {
            source: typeof o?.source === "string" ? o.source : "",
            author: typeof o?.author === "string" ? o.author : "",
            note: typeof o?.note === "string" ? o.note : "",
          };
        })
      : [],
  };
}

export type StructuredData =
  | { kind: "meeting"; data: MeetingMinutes }
  | { kind: "weeklyReport"; data: WeeklyReport }
  | { kind: "lectureNotes"; data: LectureNotes }
  | { kind: "researchDraft"; data: ResearchDraft };

export function parseStructured(kind: StructuredKind, raw: string): StructuredData {
  switch (kind) {
    case "meeting":
      return { kind, data: parseMeetingMinutes(raw) };
    case "weeklyReport":
      return { kind, data: parseWeeklyReport(raw) };
    case "lectureNotes":
      return { kind, data: parseLectureNotes(raw) };
    case "researchDraft":
      return { kind, data: parseResearchDraft(raw) };
  }
}
