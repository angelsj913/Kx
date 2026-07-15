import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

// Gemini 지도학습 파인튜닝(SFT) 작업을 실제로 시작하는 스크립트.
// ⚠️ 실행하면 Google 계정에 과금되는 원격 작업이 생성된다 — 자동으로 호출하지 말고
// 사용자가 직접 이 스크립트를 실행할 때만 동작해야 한다.
// 데이터는 먼저 `npm run tuning:prepare-data`로 준비해 둔다(scripts/prepare-gemini-tuning-data.mjs).

function loadDotenvFile(filePath) {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

for (const envName of [".env.local", ".env"]) {
  loadDotenvFile(resolve(process.cwd(), envName));
}

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY가 없어 파인튜닝을 시작할 수 없습니다.");
  process.exit(1);
}

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
const dataPath = resolve(
  process.cwd(),
  args.data ?? "docs/datasets/zeff-ai-tuning-examples.jsonl",
);
const baseModel = args["base-model"] ?? "gemini-2.5-flash";
const displayName = args["display-name"] ?? "zeff-ai-tuned";
const epochCount = args.epochs ? Number(args.epochs) : undefined;
const pollIntervalMs = args["poll-interval-ms"] ? Number(args["poll-interval-ms"]) : 30_000;

if (!existsSync(dataPath)) {
  console.error(
    `학습 데이터를 찾을 수 없습니다: ${dataPath}\n먼저 'npm run tuning:prepare-data'를 실행하세요.`,
  );
  process.exit(1);
}

const examples = readFileSync(dataPath, "utf8")
  .split(/\r?\n/)
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l));

if (examples.length === 0) {
  console.error("학습 데이터가 비어 있습니다.");
  process.exit(1);
}

// inline examples는 대규모 데이터셋에는 적합하지 않을 수 있다 — 개수가 크면
// TuningDataset.gcsUri(Cloud Storage)로 옮기는 걸 검토하라는 안내만 하고, 판단은
// 실행하는 사람이 Google 콘솔의 실제 한도를 보고 하도록 남겨둔다.
if (examples.length > 5000) {
  console.warn(
    `[gemini-finetune] 학습 예시가 ${examples.length}개로 많습니다. inline examples 대신 ` +
      "Cloud Storage(gcsUri)를 쓰는 게 안전한지 Google AI Studio/Vertex 문서에서 확인하세요.",
  );
}

const { GoogleGenAI } = await import("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

console.log(
  `[gemini-finetune] baseModel=${baseModel} examples=${examples.length} displayName=${displayName}`,
);

let job = await ai.tunings.tune({
  baseModel,
  trainingDataset: { examples },
  config: {
    tunedModelDisplayName: displayName,
    ...(epochCount ? { epochCount } : {}),
  },
});

console.log(`[gemini-finetune] 작업 생성됨: ${job.name} (state=${job.state})`);

const TERMINAL_STATES = new Set([
  "JOB_STATE_SUCCEEDED",
  "JOB_STATE_FAILED",
  "JOB_STATE_CANCELLED",
  "JOB_STATE_EXPIRED",
]);

while (!TERMINAL_STATES.has(job.state)) {
  await new Promise((r) => setTimeout(r, pollIntervalMs));
  job = await ai.tunings.get({ name: job.name });
  console.log(`[gemini-finetune] 상태: ${job.state}`);
}

if (job.state !== "JOB_STATE_SUCCEEDED") {
  console.error(`[gemini-finetune] 실패: ${job.state}`, job.error ?? "");
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      tunedModel: job.tunedModel?.model,
      endpoint: job.tunedModel?.endpoint,
      note: "이 모델 이름을 src/lib/models.ts에 provider:'gemini' ModelDef로 등록하면 백엔드 라우트 폴백 체인에 편입됩니다.",
    },
    null,
    2,
  ),
);
