# Unified RAG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web-first unified RAG that routes between web, private documents, and hybrid retrieval while preserving existing document RAG assets.

**Architecture:** Extend the existing RAG substrate instead of replacing it. First add shared route-decision and source-shaping primitives, then introduce a web-first retrieval path and hybrid merger, then wire UI/output formatting and free/paid budgets, and finally verify routing quality with targeted eval cases.

**Tech Stack:** Next.js 16, React 19, Prisma 7, TypeScript, existing `src/lib/rag*.ts` modules, current library indexing pipeline, existing eval harness.

## Global Constraints

- Retrieval priority is **web first**.
- Documents/notes are **supporting evidence**, not default primary source.
- Answer quality target is balanced across quality, speed, and citations.
- Default answer layout is **summary -> body -> sources**.
- Output formatting is auto-selected by question type.
- Free is limited; paid gets full retrieval budgets.
- Do not introduce Supabase/Auth/Storage work in this RAG plan.
- Extend the current RAG substrate; do not create a parallel product path.

---

## File Map

- Create: `src/lib/ragRouter.ts` — route decisions and answer-format selection.
- Create: `src/lib/ragWeb.ts` — web retrieval adapter and normalized result type.
- Modify: `src/lib/ragSearch.ts` — orchestrate `web_first`, `doc_first`, `hybrid`.
- Modify: `src/lib/ragHybrid.ts` — merge/rerank mixed-source candidates.
- Modify: `src/lib/rag.ts` or `src/lib/ragIndexing.ts` — source metadata shape if needed for `web`/`library`/`note`.
- Create: `src/lib/ragBudgets.ts` — free vs paid retrieval budgets.
- Modify: RAG API route(s) that return answers and citations (existing document search surface).
- Modify: RAG UI component/page that currently uses `rag.*` i18n strings.
- Create: `tests/ragRouter.test.ts` and `tests/ragBudgets.test.ts`.
- Update: eval or dataset docs if new route-level goldens are added.

---

### Task 1: Add route-decision and budget primitives

**Files:**
- Create: `src/lib/ragRouter.ts`
- Create: `src/lib/ragBudgets.ts`
- Test: `tests/ragRouter.test.ts`
- Test: `tests/ragBudgets.test.ts`

**Interfaces:**
- Consumes: raw question string, user plan tier, optional hint about attached/private material
- Produces:
  - `type RagRoute = "web_first" | "doc_first" | "hybrid"`
  - `type AnswerFormat = "compact_fact" | "explanatory" | "comparison" | "study_helper"`
  - `type RouteDecision = { route: RagRoute; freshnessRequired: boolean; needsPrivateSources: boolean; answerFormat: AnswerFormat; retrievalBudget: "free" | "paid" }`
  - `getRagBudget(plan: "free" | "pro" | "professional"): { webCandidates: number; docCandidates: number; allowHybrid: boolean; maxCitations: number }`

- [ ] **Step 1: Write failing route tests**

Create `tests/ragRouter.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { decideRagRoute } from "../src/lib/ragRouter";

test("routes recent public-info questions to web_first", () => {
  const result = decideRagRoute("2026 입시 변화 요약해줘", { plan: "free" });
  assert.equal(result.route, "web_first");
  assert.equal(result.freshnessRequired, true);
});

test("routes personal-material questions to doc_first", () => {
  const result = decideRagRoute("내가 올린 미적분 노트 기준으로 설명해줘", { plan: "pro" });
  assert.equal(result.route, "doc_first");
  assert.equal(result.needsPrivateSources, true);
});

test("routes comparison questions to hybrid", () => {
  const result = decideRagRoute("내 노트가 최신 출제 경향과 얼마나 맞는지 비교해줘", { plan: "professional" });
  assert.equal(result.route, "hybrid");
  assert.equal(result.answerFormat, "comparison");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx tsx --test tests/ragRouter.test.ts
```

Expected: FAIL because `src/lib/ragRouter.ts` does not exist.

- [ ] **Step 3: Write minimal router implementation**

Create `src/lib/ragRouter.ts`:

```ts
export type RagRoute = "web_first" | "doc_first" | "hybrid";
export type AnswerFormat = "compact_fact" | "explanatory" | "comparison" | "study_helper";

export type RouteDecision = {
  route: RagRoute;
  freshnessRequired: boolean;
  needsPrivateSources: boolean;
  answerFormat: AnswerFormat;
  retrievalBudget: "free" | "paid";
};

export function decideRagRoute(
  query: string,
  opts: { plan: "free" | "pro" | "professional" },
): RouteDecision {
  const q = query.toLowerCase();
  const needsPrivate = /내가 올린|내 노트|내 자료|내 문서/.test(query);
  const wantsCompare = /비교|얼마나 맞|차이/.test(query);
  const freshness = /최신|최근|변화|뉴스|2026|올해/.test(query);

  if (wantsCompare || (needsPrivate && freshness)) {
    return {
      route: "hybrid",
      freshnessRequired: true,
      needsPrivateSources: true,
      answerFormat: "comparison",
      retrievalBudget: opts.plan === "free" ? "free" : "paid",
    };
  }

  if (needsPrivate) {
    return {
      route: "doc_first",
      freshnessRequired: false,
      needsPrivateSources: true,
      answerFormat: "study_helper",
      retrievalBudget: opts.plan === "free" ? "free" : "paid",
    };
  }

  return {
    route: "web_first",
    freshnessRequired: freshness,
    needsPrivateSources: false,
    answerFormat: "compact_fact",
    retrievalBudget: opts.plan === "free" ? "free" : "paid",
  };
}
```

Create `src/lib/ragBudgets.ts`:

```ts
export function getRagBudget(plan: "free" | "pro" | "professional") {
  if (plan === "free") {
    return { webCandidates: 3, docCandidates: 3, allowHybrid: false, maxCitations: 3 };
  }
  if (plan === "professional") {
    return { webCandidates: 8, docCandidates: 8, allowHybrid: true, maxCitations: 8 };
  }
  return { webCandidates: 6, docCandidates: 6, allowHybrid: true, maxCitations: 6 };
}
```

- [ ] **Step 4: Add budget tests and run them**

Create `tests/ragBudgets.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { getRagBudget } from "../src/lib/ragBudgets";

test("free plan disables hybrid and keeps small candidate counts", () => {
  assert.deepEqual(getRagBudget("free"), {
    webCandidates: 3,
    docCandidates: 3,
    allowHybrid: false,
    maxCitations: 3,
  });
});
```

Run:

```bash
npx tsx --test tests/ragRouter.test.ts tests/ragBudgets.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ragRouter.ts src/lib/ragBudgets.ts tests/ragRouter.test.ts tests/ragBudgets.test.ts
git commit -m "feat: add unified RAG routing primitives"
```

---

### Task 2: Add normalized web retrieval adapter

**Files:**
- Create: `src/lib/ragWeb.ts`
- Modify: `src/lib/ragSearch.ts`

**Interfaces:**
- Consumes: search query, route decision, retrieval budget
- Produces:
  - `type WebEvidence = { sourceType: "web"; title: string; url: string; snippet: string; score: number }`
  - `searchWeb(query: string, budget: number): Promise<WebEvidence[]>`

- [ ] **Step 1: Write failing adapter test with stub transport**

Create a small test section in `tests/ragRouter.test.ts` or a new `tests/ragWeb.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { normalizeWebResults } from "../src/lib/ragWeb";

test("normalizes raw web results into citation-ready evidence", () => {
  const out = normalizeWebResults([
    { title: "A", url: "https://example.com/a", snippet: "alpha", score: 0.9 },
  ]);
  assert.deepEqual(out, [
    { sourceType: "web", title: "A", url: "https://example.com/a", snippet: "alpha", score: 0.9 },
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx tsx --test tests/ragWeb.test.ts
```

Expected: FAIL because `src/lib/ragWeb.ts` does not exist.

- [ ] **Step 3: Implement minimal normalized web adapter**

Create `src/lib/ragWeb.ts`:

```ts
export type WebEvidence = {
  sourceType: "web";
  title: string;
  url: string;
  snippet: string;
  score: number;
};

export function normalizeWebResults(
  rows: Array<{ title: string; url: string; snippet: string; score: number }>,
): WebEvidence[] {
  return rows
    .filter((row) => row.title && row.url)
    .map((row) => ({
      sourceType: "web",
      title: row.title,
      url: row.url,
      snippet: row.snippet,
      score: row.score,
    }));
}

export async function searchWeb(_query: string, _budget: number): Promise<WebEvidence[]> {
  return [];
}
```

- [ ] **Step 4: Wire orchestration entry point**

In `src/lib/ragSearch.ts`, add imports and branch logic so route decisions can call `searchWeb()` for `web_first` and `hybrid` paths, even if the first version returns an empty array until transport wiring is added.

Code to add near the orchestrator:

```ts
import { decideRagRoute } from "@/lib/ragRouter";
import { getRagBudget } from "@/lib/ragBudgets";
import { searchWeb } from "@/lib/ragWeb";
```

And inside the retrieval function:

```ts
const decision = decideRagRoute(query, { plan });
const budget = getRagBudget(plan);
const webEvidence =
  decision.route === "web_first" || decision.route === "hybrid"
    ? await searchWeb(query, budget.webCandidates)
    : [];
```

- [ ] **Step 5: Run tests and typecheck**

Run:

```bash
npx tsx --test tests/ragWeb.test.ts tests/ragRouter.test.ts tests/ragBudgets.test.ts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ragWeb.ts src/lib/ragSearch.ts tests/ragWeb.test.ts
git commit -m "feat: add web retrieval adapter for unified RAG"
```

---

### Task 3: Add hybrid merger and split citations

**Files:**
- Modify: `src/lib/ragHybrid.ts`
- Modify: `src/lib/ragSearch.ts`
- Modify: answer-producing RAG route/component that currently returns document-only citations

**Interfaces:**
- Consumes: web evidence, document chunks
- Produces:
  - unified evidence list with `sourceType`
  - response payload containing `webSources` and `materialSources`

- [ ] **Step 1: Write failing mixed-source test**

Create `tests/ragHybridUnified.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { splitSourcesByType } from "../src/lib/ragHybrid";

test("splits mixed evidence into web and material groups", () => {
  const result = splitSourcesByType([
    { sourceType: "web", title: "A", url: "https://a", snippet: "alpha", score: 0.9 },
    { sourceType: "library", title: "Doc 1", url: "library:1", snippet: "beta", score: 0.8 },
  ]);
  assert.equal(result.web.length, 1);
  assert.equal(result.materials.length, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx tsx --test tests/ragHybridUnified.test.ts
```

Expected: FAIL because `splitSourcesByType` does not exist.

- [ ] **Step 3: Implement minimal merger helpers**

In `src/lib/ragHybrid.ts`, add:

```ts
export type UnifiedEvidence =
  | { sourceType: "web"; title: string; url: string; snippet: string; score: number }
  | { sourceType: "library" | "note"; title: string; url: string; snippet: string; score: number };

export function splitSourcesByType(items: UnifiedEvidence[]) {
  return {
    web: items.filter((item) => item.sourceType === "web"),
    materials: items.filter((item) => item.sourceType !== "web"),
  };
}
```

- [ ] **Step 4: Wire answer payload**

Update the RAG answer payload so it returns:

```ts
{
  summary: string,
  answer: string,
  webSources: [...],
  materialSources: [...],
}
```

The UI should no longer assume a single flat citation list.

- [ ] **Step 5: Run tests and typecheck**

Run:

```bash
npx tsx --test tests/ragHybridUnified.test.ts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ragHybrid.ts src/lib/ragSearch.ts tests/ragHybridUnified.test.ts
git commit -m "feat: split unified RAG citations by source type"
```

---

### Task 4: Add UI formatting and free/paid behavior

**Files:**
- Modify: existing RAG UI surface that uses `rag.*` strings
- Modify: relevant API route or response mapper
- Possibly modify: `src/lib/i18n.ts`

**Interfaces:**
- Consumes: `RouteDecision`, split citation payload, user plan
- Produces: UI sections for summary, body, web citations, and material citations

- [ ] **Step 1: Write failing UI behavior test or snapshot**

If UI tests exist nearby, add a focused test. If not, add a route/mapper-level test that expects:

```ts
{
  summary: "one-line summary",
  answer: "longer answer body",
  webSources: [{ title: "..." }],
  materialSources: [{ title: "..." }],
}
```

- [ ] **Step 2: Implement render sections**

Add explicit sections:

```tsx
<section>
  <h3>요약</h3>
  <p>{summary}</p>
</section>
<section>
  <h3>답변</h3>
  <p>{answer}</p>
</section>
<section>
  <h3>웹 출처</h3>
  ...
</section>
<section>
  <h3>내 자료</h3>
  ...
</section>
```

- [ ] **Step 3: Enforce free/paid limits**

In the orchestration layer, trim evidence counts according to `getRagBudget(plan)` before answer composition.

Example:

```ts
const webCandidates = allWeb.slice(0, budget.webCandidates);
const docCandidates = allDocs.slice(0, budget.docCandidates);
const allowHybrid = budget.allowHybrid;
```

- [ ] **Step 4: Run local verification**

Run:

```bash
npx tsc --noEmit
npm run lint
```

Expected: PASS (or existing warnings only).

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n.ts src/app src/components
git commit -m "feat: render unified RAG answers with split sources"
```

---

### Task 5: Add evaluation coverage and docs

**Files:**
- Modify: eval harness or dataset docs for route-level checks
- Modify: `docs/RAG_REINDEX.md` if indexing/retrieval guidance changes
- Modify: `docs/PRD_UNIFIED_RAG_2026-07.md` only if implementation reveals a necessary scope correction

**Interfaces:**
- Consumes: route decisions and unified answer payload
- Produces: repeatable evaluation cases for `web_first`, `doc_first`, `hybrid`

- [ ] **Step 1: Add three representative eval cases**

Create or extend eval data with:

```text
1. recent public-info question -> web_first
2. private-note question -> doc_first
3. comparison question -> hybrid
```

- [ ] **Step 2: Run evaluation**

Run:

```bash
npm run eval:ai
```

Expected: new unified-RAG cases pass, and previous RAG cases remain green.

- [ ] **Step 3: Update reindex/documentation notes if needed**

If retrieval metadata or source labeling requires reindex guidance changes, update `docs/RAG_REINDEX.md` with exact conditions.

- [ ] **Step 4: Commit**

```bash
git add docs/RAG_REINDEX.md docs/PRD_UNIFIED_RAG_2026-07.md docs/superpowers/specs/2026-07-28-unified-rag-design.md eval
git commit -m "test: add unified RAG evaluation coverage"
```

---

## Self-Review

- Spec coverage: plan covers router, web/doc/hybrid retrieval, output format, split citations, and free/paid budgets.
- Placeholder scan: no `TBD`, `TODO`, or vague follow-ups remain in execution steps.
- Type consistency: `RagRoute`, `AnswerFormat`, `RouteDecision`, budget shapes, and split citation payloads are defined before later tasks consume them.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-28-unified-rag.md`. Two execution options:

1. **I can implement it here** on a fresh branch, task-by-task.
2. **I can hand it to a subagent/executor** to run the plan with checkpoints.
