import type { AppLanguage } from "./languages";

/**
 * 퀵툴 입력창 예시(placeholder)의 다국어 버전. 한국어는 각 ToolDef.placeholder를
 * 그대로 쓰고(폴백), 그 외 언어는 여기서 가져온다. 특정 언어가 없으면 영어로 폴백한다.
 * (설정이 영어인데 예시에 한국어가 뜨던 버그 수정)
 */
type PH = Partial<Record<AppLanguage, string>>;

const PLACEHOLDERS: Record<string, PH> = {
  chat: { en: "Ask me anything…" },
  bizdoc: {
    en: "e.g. I want to politely let my manager know a deliverable due this week will be late.",
  },
  ppt: {
    en: "e.g. New product launch strategy deck — include market overview, target customers, marketing plan, and revenue forecast.",
  },
  excel: {
    en: "e.g. First-half spending report by team — columns for team, item, amount, and notes.",
  },
  meeting: {
    en: "e.g. Marketing sync today. Attendees: Minjun, Seoyeon, Jihoon. Discussed next campaign budget and schedule. Minjun to draft budget by Fri, Seoyeon to prep mockups by next Wed.",
  },
  "weekly-report": {
    en: "e.g. This week I nearly finished the new landing page design and prepped the client meeting. Next week: hand off to dev and run QA.",
  },
  lecture: { en: "e.g. https://www.youtube.com/watch?v=..." },
  audio: {
    en: "Attach a class/lecture recording (or record), then tap organize.",
  },
  presentation: {
    en: "e.g. Write a 5-minute speech on the theme 'our part in protecting the environment.'",
  },
  "lecture-notes": { en: "e.g. Paste today's microeconomics supply-and-demand notes…" },
  "research-draft": {
    en: "e.g. Write a report draft on 'the impact of climate change on domestic agriculture.'",
  },
  "exam-analysis": { en: "Add any context for the analysis (optional)" },
  "exam-similarity": { en: "Add any context for the comparison (optional)" },
  "doc-convert": { en: "Add any context for the conversion (optional)" },
  "video-summary": {
    en: "Enter a YouTube URL or a summary request. You can also attach a transcript, audio, or screenshots.",
  },
  "note-a4": {
    en: "Enter the notes/explanation to organize. You can also attach a photo of the board.",
  },
  "word-doc": { en: "e.g. Weekly work report / proposal draft …" },
  "math-solve": { en: "Type the problem, or attach a photo of it." },
  "math-graph": {
    en: "e.g. Plot y = 2x·cos(x²) / show projectile range vs. angle and initial speed in 3D",
  },
  "image-gen": {
    en: "e.g. A laptop and coffee cup under a blue sky, watercolor style",
  },
  agent: {
    en: "e.g. Find A in my library, summarize it, and build a slide deck from it",
  },
  "doc-translate": { en: "Type the text to translate, or attach a document." },
  "exam-maker": {
    en: "e.g. Grade 11 math · calculus · trig & limits · mostly multiple choice · medium-hard · 20 questions",
  },
  "similar-problems": {
    en: "e.g. Make 5 multiple-choice questions on chemical equations for 8th-grade science.",
  },
  "lecture-chat": { en: "e.g. https://www.youtube.com/watch?v=..." },
};

/** 도구 입력창 placeholder를 현재 언어로. 한국어이거나 번역이 없으면 fallbackKo(원본)를 쓴다. */
export function getToolPlaceholder(
  toolId: string,
  lang: AppLanguage,
  fallbackKo: string,
): string {
  if (lang === "ko") return fallbackKo;
  const entry = PLACEHOLDERS[toolId];
  return entry?.[lang] ?? entry?.en ?? fallbackKo;
}
