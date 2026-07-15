import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

// docs/datasets/zeff-ai-training-*.jsonl 은 {instruction, output} 형태인데,
// Gemini tunings.tune()의 TuningExample은 {textInput, output}을 요구한다.
// 순수 필드 변환만 하는 1회성 스크립트 — DB/API 호출 없음, 안전하게 반복 실행 가능.

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
const outPath = resolve(
  process.cwd(),
  args.out ?? "docs/datasets/zeff-ai-tuning-examples.jsonl",
);
const limit = args.limit ? Number(args.limit) : undefined;

if (!existsSync(sourcePath)) {
  console.error(`원본 데이터셋을 찾을 수 없습니다: ${sourcePath}`);
  process.exit(1);
}

const lines = readFileSync(sourcePath, "utf8").split(/\r?\n/).filter((l) => l.trim());
const examples = [];
let skipped = 0;

for (const line of lines) {
  if (limit && examples.length >= limit) break;
  let obj;
  try {
    obj = JSON.parse(line);
  } catch {
    skipped += 1;
    continue;
  }
  const textInput = typeof obj?.instruction === "string" ? obj.instruction.trim() : "";
  const output = typeof obj?.output === "string" ? obj.output.trim() : "";
  if (!textInput || !output) {
    skipped += 1;
    continue;
  }
  examples.push({ textInput, output });
}

writeFileSync(outPath, examples.map((e) => JSON.stringify(e)).join("\n") + "\n", "utf8");

console.log(
  JSON.stringify(
    { ok: true, sourcePath, outPath, examples: examples.length, skipped },
    null,
    2,
  ),
);
