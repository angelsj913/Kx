import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

// docs/datasets/zeff-ai-training-10000.jsonl은 파인튜닝용으로 같은 사실을 여러 문구로
// 반복한 데이터셋이라(10,000개 중 고유 답변은 733개뿐) RAG에는 안 맞는다. 답변 텍스트
// 기준으로 중복 제거해 고유 사실만 마크다운 소스 문서로 만들어, 기존 RAG 색인
// 파이프라인(scripts/index-zeff-rag.mjs, chunkText)에 그대로 넣을 수 있게 한다.

const CATEGORY_LABELS = {
  product: "제품",
  distribution: "배포",
  windows: "Windows",
  playstore: "Play 스토어",
  tech: "기술 스택",
  build: "빌드/배포 설정",
  ui: "UI/UX",
  ai: "AI 제공자",
  rag: "RAG/문서 검색",
  policy: "운영 정책",
};

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = "true";
      continue;
    }
    out[key] = next;
    i += 1;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const sourcePath = resolve(
  process.cwd(),
  args.source ?? "docs/datasets/zeff-ai-training-10000.jsonl",
);
const outPath = resolve(process.cwd(), args.out ?? "docs/datasets/zeff-ai-qa-source.md");

if (!existsSync(sourcePath)) {
  console.error(`원본 데이터셋을 찾을 수 없습니다: ${sourcePath}`);
  process.exit(1);
}

const lines = readFileSync(sourcePath, "utf8").split(/\r?\n/).filter((l) => l.trim());
const seenOutputs = new Set();
const byCategory = new Map();
let skipped = 0;

for (const line of lines) {
  let obj;
  try {
    obj = JSON.parse(line);
  } catch {
    skipped += 1;
    continue;
  }
  const instruction = typeof obj?.instruction === "string" ? obj.instruction.trim() : "";
  const output = typeof obj?.output === "string" ? obj.output.trim() : "";
  const category = typeof obj?.category === "string" ? obj.category.trim() : "";
  if (!instruction || !output) {
    skipped += 1;
    continue;
  }
  // 같은 답변을 여러 문구로 반복한 항목은 첫 번째(가장 단순한 질문 문구)만 대표로 남긴다.
  if (seenOutputs.has(output)) continue;
  seenOutputs.add(output);

  const list = byCategory.get(category) ?? [];
  list.push({ instruction, output });
  byCategory.set(category, list);
}

const sections = [...byCategory.entries()].map(([category, items]) => {
  const label = CATEGORY_LABELS[category] ?? category;
  const body = items
    .map((item) => `### ${item.instruction}\n${item.output}`)
    .join("\n\n");
  return `## ${label}\n\n${body}`;
});

const doc = ["# ZEFF AI 운영 지식 Q&A", "", ...sections].join("\n\n") + "\n";
writeFileSync(outPath, doc, "utf8");

const uniqueCount = [...byCategory.values()].reduce((sum, list) => sum + list.length, 0);
console.log(
  JSON.stringify(
    {
      ok: true,
      sourcePath,
      outPath,
      totalRead: lines.length,
      skipped,
      uniqueFacts: uniqueCount,
      categories: [...byCategory.keys()],
    },
    null,
    2,
  ),
);
