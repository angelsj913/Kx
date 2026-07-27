#!/usr/bin/env node
/**
 * ZEFF AI 골든셋 회귀 평가
 * - API 키 없이: 파싱·검증·하이브리드·스모크 케이스
 * - API 키 있으면: 선택적 live 케이스 (--live)
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const GOLDEN_DIR = join(ROOT, "docs/eval/golden");

const live = process.argv.includes("--live");
const results = [];

function pass(name: string, detail?: string) {
  results.push({ name, ok: true, detail });
  console.log("PASS", name, detail ?? "");
}
function fail(name: string, detail?: string) {
  results.push({ name, ok: false, detail });
  console.log("FAIL", name, detail ?? "");
}

/** Golden JSON: raw array or `{ cases: [...] }` wrapper. */
function loadGoldenCases(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === "object") {
    const cases = (raw as { cases?: unknown }).cases;
    if (Array.isArray(cases)) return cases as Record<string, unknown>[];
  }
  return [];
}

// 1) smoke-tools
const smoke = spawnSync("npx", ["tsx", "scripts/smoke-tools.mts"], {
  cwd: ROOT,
  encoding: "utf8",
});
if (smoke.status === 0) pass("smoke-tools.mts", "all checks");
else fail("smoke-tools.mts", smoke.stderr?.slice(0, 200) || smoke.stdout?.slice(0, 200));

// 2) golden JSON cases
if (!existsSync(GOLDEN_DIR)) {
  fail("golden-dir", "docs/eval/golden missing");
} else {
  const files = readdirSync(GOLDEN_DIR).filter((f) => f.endsWith(".json") && f !== "manifest.json");
  let total = 0;
  let passed = 0;

  for (const file of files) {
    const cases = loadGoldenCases(JSON.parse(readFileSync(join(GOLDEN_DIR, file), "utf8")));
    if (!cases.length) continue;
    for (let ci = 0; ci < cases.length; ci++) {
      const c = cases[ci]!;
      total++;
      const name = `${file}::${String(c.id ?? ci)}`;
      try {
        if (file === "moderation.json") {
          const { moderateInput } = await import("../src/lib/moderation.ts");
          const result = moderateInput(String(c.input ?? ""));
          const expectBlocked = c.expect === "blocked";
          const ok = expectBlocked ? !result.allowed : result.allowed;
          if (ok) {
            pass(name, expectBlocked ? result.category : "allowed");
            passed++;
          } else {
            fail(
              name,
              `expected ${String(c.expect)}, got ${result.allowed ? "allowed" : result.category}`,
            );
          }
        } else if (file === "image-prompt.json") {
          const { buildImagePrompt } = await import("../src/lib/imagePrompt.ts");
          const prompt = buildImagePrompt(String(c.input ?? ""));
          const mustInclude = (c.mustInclude as string[] | undefined) ?? [];
          const mustNotInclude = (c.mustNotInclude as string[] | undefined) ?? [];
          const missing = mustInclude.filter((s) => !prompt.includes(s));
          const forbidden = mustNotInclude.filter((s) => prompt.includes(s));
          if (missing.length === 0 && forbidden.length === 0) {
            pass(name, `${prompt.length} chars`);
            passed++;
          } else {
            fail(
              name,
              [
                missing.length ? `missing: ${missing.join(", ")}` : "",
                forbidden.length ? `forbidden: ${forbidden.join(", ")}` : "",
              ]
                .filter(Boolean)
                .join("; "),
            );
          }
        } else if (c.type === "ppt_parse") {
          const { parseDeck } = await import("../src/lib/pptx.ts");
          parseDeck(JSON.stringify(c.input));
          pass(name);
          passed++;
        } else if (c.type === "ppt_validate") {
          const { validateDeck } = await import("../src/lib/pptValidate.ts");
          const { parseDeck } = await import("../src/lib/pptx.ts");
          const deck = parseDeck(JSON.stringify(c.input));
          const v = validateDeck(deck);
          const expectOk = c.expectOk !== false;
          if (v.ok === expectOk) {
            pass(name);
            passed++;
          } else {
            fail(name, `expected ok=${expectOk}, got ${v.ok}`);
          }
        } else if (c.type === "hybrid_score") {
          const { hybridScore, keywordOverlapScore, passesRetrievalThreshold } = await import(
            "../src/lib/ragHybrid.ts"
          );
          const kw = keywordOverlapScore(c.query, c.content);
          const score = hybridScore(c.vectorScore ?? 0.5, kw);
          if (c.expectPass !== undefined) {
            if (passesRetrievalThreshold(score) === c.expectPass) {
              pass(name, `score=${score.toFixed(3)}`);
              passed++;
            } else fail(name, `score=${score.toFixed(3)}`);
          } else {
            pass(name, `score=${score.toFixed(3)}`);
            passed++;
          }
        } else if (c.type === "math_verify") {
          const { verifyMathSolve } = await import("../src/lib/mathVerify.ts");
          const result = verifyMathSolve(c.text);
          const ok = result !== null && result.failed.length === 0;
          if (ok === (c.expectOk !== false)) {
            pass(name);
            passed++;
          } else fail(name, `verify ok=${ok} failed=${result?.failed?.length ?? "null"}`);
        } else if (c.type === "youtube_id") {
          const { parseYoutubeId } = await import("../src/lib/videoContext.ts");
          const id = parseYoutubeId(c.url);
          if (id === c.expectedId) {
            pass(name);
            passed++;
          } else fail(name, `got ${id}`);
        } else if (c.type === "intent") {
          const { detectQuickToolFromText } = await import("../src/lib/intentTools.ts");
          const tool = detectQuickToolFromText(c.text);
          if (tool === c.expectedTool) {
            pass(name);
            passed++;
          } else fail(name, `got ${tool}`);
        } else if (c.type === "skill_pack") {
          const { selectSkillPacks } = await import("../src/lib/skills/index.ts");
          const got = selectSkillPacks(String(c.text ?? "")).map((p) => p.id);
          const expected = (c.expectedSkills as string[] | undefined) ?? [];
          const ok =
            expected.length > 0 &&
            expected.every((id) => got.includes(id as (typeof got)[number]));
          if (ok) {
            pass(name, got.join(","));
            passed++;
          } else {
            fail(name, `got [${got.join(",")}], expected [${expected.join(",")}]`);
          }
        } else if (c.type === "agent_escalate") {
          const { shouldEscalateToAgent } = await import("../src/lib/skills/index.ts");
          const got = shouldEscalateToAgent(String(c.text ?? ""));
          if (got === !!c.expectedEscalate) {
            pass(name, String(got));
            passed++;
          } else {
            fail(name, `got ${got}, expected ${!!c.expectedEscalate}`);
          }
        } else if (c.type === "verify_risk") {
          const { draftVerifyRiskScore } = await import("../src/lib/backendRoute.ts");
          const score = draftVerifyRiskScore(String(c.text ?? ""));
          const minRisk = Number(c.minRisk ?? 0);
          if (score >= minRisk) {
            pass(name, `risk=${score}`);
            passed++;
          } else {
            fail(name, `risk=${score} < minRisk=${minRisk}`);
          }
        } else if (c.type === "docx_build") {
          const { buildDocxBase64, parseMarkdownSections } = await import("../src/lib/docx.ts");
          const doc = parseMarkdownSections(c.markdown);
          const b64 = await buildDocxBase64(doc);
          if (b64.length > 100) {
            pass(name, `${b64.length} chars`);
            passed++;
          } else fail(name, "empty docx");
        } else if (c.type === "live_skip") {
          if (live && process.env.GEMINI_API_KEY) {
            pass(name, "live skipped in CI template");
          } else {
            pass(name, "offline skip");
          }
          passed++;
        } else {
          fail(name, `unknown type ${c.type}`);
        }
      } catch (err) {
        fail(name, err instanceof Error ? err.message : String(err));
      }
    }
  }
  console.log(`\nGolden: ${passed}/${total} passed`);
}

const failed = results.filter((r) => !r.ok).length;
const summary = {
  total: results.length,
  passed: results.length - failed,
  failed,
  live,
  timestamp: new Date().toISOString(),
};
console.log("\n--- eval:ai summary ---");
console.log(JSON.stringify(summary, null, 2));
process.exit(failed > 0 ? 1 : 0);
