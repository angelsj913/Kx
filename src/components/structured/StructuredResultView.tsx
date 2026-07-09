"use client";

import MeetingMinutesView from "./MeetingMinutesView";
import WeeklyReportView from "./WeeklyReportView";
import LectureNotesView from "./LectureNotesView";
import ResearchDraftView from "./ResearchDraftView";
import type {
  MeetingMinutes,
  WeeklyReport,
  LectureNotes,
  ResearchDraft,
} from "@/lib/structured";

type Props =
  | { id: string; kind: "meeting"; data: MeetingMinutes }
  | { id: string; kind: "weeklyReport"; data: WeeklyReport }
  | { id: string; kind: "lectureNotes"; data: LectureNotes }
  | { id: string; kind: "researchDraft"; data: ResearchDraft };

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
  }
}
