import { parseDeck, buildPptxBase64, resolvePalette, inferThemePreset } from "../src/lib/pptx.ts";
import { parseWorkbook, buildXlsxBase64 } from "../src/lib/xlsx.ts";
import { detectQuickToolFromText } from "../src/lib/intentTools.ts";
import { getTool } from "../src/lib/tools.ts";
import { modelsForTier } from "../src/lib/models.ts";

type R = { name: string; ok: boolean; detail?: string };
const results: R[] = [];
function check(name: string, pass: boolean, detail?: string) {
  results.push({ name, ok: pass, detail });
  console.log(pass ? "PASS" : "FAIL", name, detail ?? "");
}

const sample = {
  title: "세포 분열의 이해",
  subtitle: "중학생 대상 10분 발표",
  theme: { preset: "science" },
  slides: [
    {
      layout: "agenda",
      title: "오늘 배울 내용",
      bullets: ["분열의 의미", "체세포 분열 단계", "감수 분열 비교", "표로 정리", "핵심 요약"],
    },
    { layout: "section", title: "1. 왜 세포는 나뉠까?", subtitle: "성장·재생·번식" },
    {
      layout: "process",
      title: "체세포 분열은 4단계로 진행된다",
      diagram: {
        type: "process",
        steps: [
          { label: "전기", desc: "염색체 응축" },
          { label: "중기", desc: "적도 정렬" },
          { label: "후기", desc: "염색분체 분리" },
          { label: "말기", desc: "핵 재형성" },
        ],
      },
      bullets: ["각 단계는 유전 정보를 정확히 나누기 위한 절차다"],
      notes: "손으로 네 단계를 짚으며 설명해 주세요.",
    },
    {
      layout: "table",
      title: "체세포 분열 vs 감수 분열",
      table: {
        headers: ["구분", "체세포 분열", "감수 분열"],
        rows: [
          ["목적", "성장·재생", "생식 세포"],
          ["분열 횟수", "1회", "2회"],
          ["염색체 수", "유지", "반감"],
          ["결과 세포", "2개", "4개"],
        ],
      },
      bullets: ["표를 보면 목적과 결과 세포 수가 핵심 차이다"],
    },
    {
      layout: "cycle",
      title: "세포 주기는 반복된다",
      diagram: {
        type: "cycle",
        steps: [
          { label: "G1", desc: "성장" },
          { label: "S", desc: "DNA 복제" },
          { label: "G2", desc: "준비" },
          { label: "M", desc: "분열" },
        ],
      },
    },
    {
      layout: "cards",
      title: "기억할 세 가지",
      diagram: {
        type: "cards",
        steps: [
          { label: "성장", desc: "몸이 커질 때" },
          { label: "재생", desc: "상처가 아물 때" },
          { label: "유전", desc: "정보가 전달될 때" },
        ],
      },
    },
    {
      layout: "closing",
      title: "감사합니다",
      subtitle: "질문 환영합니다",
      bullets: ["세포 분열 = 생명 유지의 기본", "단계·표로 비교해 기억하기"],
    },
  ],
};

const deck = parseDeck(JSON.stringify(sample));
check("ppt.parseDeck", deck.slides.length === 7, `slides=${deck.slides.length}`);
check("ppt.hasTable", !!deck.slides.some((s) => s.table));
check("ppt.hasDiagram", !!deck.slides.some((s) => s.diagram));
check("ppt.theme", deck.theme?.preset === "science");
check("ppt.inferTheme", inferThemePreset("세포 분열", "생물") === "science");
const pal = resolvePalette(deck.theme, deck.title, deck.subtitle);
check("ppt.palette", pal.primary === "0369A1", pal.primary);

const b64 = await buildPptxBase64(deck);
check("ppt.build", typeof b64 === "string" && b64.length > 2000, `len=${b64.length}`);

const fenced =
  "```json\n" +
  JSON.stringify({
    title: "t",
    theme: { preset: "tech" },
    slides: [{ title: "a", bullets: ["b", "c", "d", "e"] }],
  }) +
  "\n```";
check("ppt.fenced", parseDeck(fenced).title === "t");

const wb = parseWorkbook(
  JSON.stringify({
    title: "매출",
    sheets: [{ name: "요약", columns: ["월", "매출"], rows: [["1월", 100], ["2월", 120]] }],
  }),
);
check("xlsx.parse", wb.sheets[0]!.rows.length === 2);
check("xlsx.build", (await buildXlsxBase64(wb)).length > 500);

check("intent.ppt", detectQuickToolFromText("세포 분열 ppt 만들어줘") === "ppt");
check("intent.excel", detectQuickToolFromText("매출 엑셀로 만들어") === "excel");
check("intent.plain", detectQuickToolFromText("안녕") === null);

for (const id of ["ppt", "excel", "video-summary", "note-a4", "exam-maker"]) {
  check(`tool.${id}`, !!getTool(id));
}

check("models.free", modelsForTier("standard").filter((m) => m.free).length >= 5);
check("models.tier", modelsForTier("standard").some((m) => m.free));

const failed = results.filter((r) => !r.ok);
console.log("---");
console.log(`TOTAL ${results.length} PASS ${results.length - failed.length} FAIL ${failed.length}`);
if (failed.length) process.exit(1);
