"use client";

import dynamic from "next/dynamic";
import MeetingMinutesView from "./MeetingMinutesView";
import WeeklyReportView from "./WeeklyReportView";
import LectureNotesView from "./LectureNotesView";
import ResearchDraftView from "./ResearchDraftView";
import ExamAnalysisView from "./ExamAnalysisView";
import PracticeSetView from "./PracticeSetView";
import type {
  MeetingMinutes,
  WeeklyReport,
  LectureNotes,
  ResearchDraft,
  ExamAnalysis,
  PracticeSet,
  MathGraph,
} from "@/lib/structured";

// Plotly가 window/canvas를 만지므로 SSR 불가 — 이 뷰만 예외적으로 dynamic import.
const GraphView = dynamic(() => import("./GraphView"), {
  ssr: false,
  loading: () => (
    <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60 sm:h-96" />
  ),
});

type Props =
  | { id: string; kind: "meeting"; data: MeetingMinutes }
  | { id: string; kind: "weeklyReport"; data: WeeklyReport }
  | { id: string; kind: "lectureNotes"; data: LectureNotes }
  | { id: string; kind: "researchDraft"; data: ResearchDraft }
  | { id: string; kind: "examAnalysis"; data: ExamAnalysis }
  | { id: string; kind: "practiceSet"; data: PracticeSet }
  | { id: string; kind: "mathGraph"; data: MathGraph };

/** structuredKind에 맞는 편집기를 골라 렌더링한다. 항목이 바뀌면 호출부에서 key={id}로 리마운트시켜야 한다. */
export default function StructuredResultView(props: Props) {
  switch (props.kind) {
    case "meeting":
      return <MeetingMinutesView id={props.id} initial={props.data} />;
    case "weeklyReport":
      return <WeeklyReportView id={props.id} initial={props.data} />;
    case "lectureNotes":
      return <LectureNotesView id={props.id} initial={props.data} />;
    case "researchDraft":
      return <ResearchDraftView id={props.id} initial={props.data} />;
    case "examAnalysis":
      return <ExamAnalysisView id={props.id} initial={props.data} />;
    case "practiceSet":
      return <PracticeSetView id={props.id} initial={props.data} />;
    case "mathGraph":
      return <GraphView id={props.id} initial={props.data} />;
  }
}
