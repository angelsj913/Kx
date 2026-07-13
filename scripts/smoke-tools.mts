import { parseDeck, buildPptxBase64 } from "../src/lib/pptx.ts";
import { parseWorkbook, buildXlsxBase64 } from "../src/lib/xlsx.ts";
import { detectQuickToolFromText } from "../src/lib/intentTools.ts";
import { getTool } from "../src/lib/tools.ts";
import { modelsForTier, listFreeModelIds } from "../src/lib/models.ts";
import { pickAgent } from "../src/lib/agents.ts";

type R = { name: string; ok: boolean; detail?: string };
const results: R[] = [];
function check(name: string, pass: boolean, detail?: string) {
  results.push({ name, ok: pass, detail });
  console.log(pass ? "PASS" : "FAIL", name, detail ?? "");
}

const sample = {
  title: "세포 분열의 이해",
  subtitle: "중학생 대상 10분 발표",
  slides: [
    { layout: "agenda", title: "오늘 배울 내용", bullets: ["분열이란", "체세포 분열", "생식 세포 분열", "요약"] },
    { layout: "section", title: "1. 세포 분열이란?", subtitle: "생명 유지의 기초" },
    {
      layout: "content",
      title: "세포 분열은 생명 유지의 핵심 과정",
      bullets: ["성장과 재생에 필요", "유전 정보 전달", "단세포 생물의 번식"],
      notes: "피부 재생 예를 들어 설명합니다.",
    },
    {
      layout: "twoColumn",
      title: "체세포 분열 vs 감수 분열",
      bullets: ["체세포: 성장·재생", "염색체 수 유지"],
      bulletsRight: ["감수: 생식 세포", "염색체 수 반감"],
    },
    { layout: "closing", title: "감사합니다", subtitle: "질문 환영합니다", bullets: ["핵심: 분열은 생명 유지", "Q&A"] },
  ],
};

const deck = parseDeck(JSON.stringify(sample));
check("ppt.parseDeck", deck.slides.length === 5, `slides=${deck.slides.length}`);
const b64 = await buildPptxBase64(deck);
check("ppt.buildPptxBase64", typeof b64 === "string" && b64.length > 1000, `len=${b64.length}`);

try {
  parseDeck(JSON.stringify({ title: "x", slides: [] }));
  check("ppt.emptyReject", false, "should throw");
} catch {
  check("ppt.emptyReject", true);
}

const fenced = "```json\n" + JSON.stringify({ title: "t", slides: [{ title: "a", bullets: ["b"] }] }) + "\n```";
const d2 = parseDeck(fenced);
check("ppt.fencedJson", d2.title === "t" && d2.slides.length === 1);

const wb = parseWorkbook(
  JSON.stringify({
    title: "매출",
    sheets: [{ name: "요약", columns: ["월", "매출"], rows: [["1월", 100], ["2월", 120]] }],
  }),
);
check("xlsx.parse", wb.sheets[0]!.rows.length === 2);
const xb = await buildXlsxBase64(wb);
check("xlsx.build", xb.length > 500, `len=${xb.length}`);

check("intent.ppt", detectQuickToolFromText("세포 분열 ppt 만들어줘") === "ppt");
check("intent.excel", detectQuickToolFromText("매출 엑셀로 만들어") === "excel");
check("intent.video", detectQuickToolFromText("영상 요약 https://youtube.com/watch?v=x") === "video-summary");
check("intent.note", detectQuickToolFromText("수업 노트 정리해줘") === "note-a4");
check("intent.exam", detectQuickToolFromText("수학 시험지 만들어줘") === "exam-maker");
check("intent.plain", detectQuickToolFromText("안녕") === null);

for (const id of ["ppt", "excel", "video-summary", "note-a4", "exam-maker", "word-doc", "math-solve", "presentation"]) {
  check(`tool.${id}`, !!getTool(id));
}

const free = listFreeModelIds();
check("models.freePool", free.length >= 15, `count=${free.length}`);
check("models.routerFirst", free[0] === "openrouter/free");
check("models.tier", modelsForTier("standard").some((m) => m.free));

check("agent.writing", pickAgent("보고서 작성해줘", false).id === "writing");
check("agent.general", pickAgent("안녕", false).id === "general");

const failed = results.filter((r) => !r.ok);
console.log("---");
console.log(`TOTAL ${results.length} PASS ${results.length - failed.length} FAIL ${failed.length}`);
if (failed.length) process.exit(1);
