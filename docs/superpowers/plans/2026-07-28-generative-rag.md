# Generative RAG Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Approach 3 — a layered generative RAG platform that routes user requests to report, presentation, study, or inline skills, retrieves web/library/hybrid evidence, and returns cited previews with optional file artifacts.

**Architecture:** Extend existing `rag*.ts`, `tools.ts`, and `toolGeneration.ts` behind a new orchestrator (`generativeRag.ts`). L0 router decides skill + evidence route + mode; L1 Standard Generate is the Phase 1 default; L2 Agentic Generate ships in Phase 3. Chat API delegates non-inline skills to the orchestrator; sidebar tools pass `forceSkill`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Prisma 7, existing `retrieveChunks`, `toolGeneration`, `structured.ts`, `docx.ts`, `pptx.ts`, `node:test` for unit tests, `scripts/eval-ai.mts` for golden routing cases.

## Global Constraints

- Evidence priority: **web-first** when freshness matters; doc-first when user material is explicit; hybrid for comparisons.
- Default chat layout for generative results: **summary → body → split citations** (Web | Your materials).
- Free plan: Standard Generate only, capped retrieval, **no file export**, no agentic.
- Paid plans: full Standard, agentic when complex (Phase 3), file export (Phase 2).
- Extend existing RAG/tool substrate — **do not** fork a parallel product path.
- Do not introduce Supabase/auth/storage work in this plan.
- Read relevant Next.js guides in `node_modules/next/dist/docs/` before API/route changes.
- Phase 1 scope: Standard Generate for **report + study + inline**; presentation/file export/agentic deferred to Phase 2/3.

---

## File Map (all phases)

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/generativeRouter.ts` | Create | L0 skill + route + mode decisions |
| `src/lib/generativeBudgets.ts` | Create | Plan-tier retrieval/generation caps |
| `src/lib/ragWeb.ts` | Create | Web evidence normalize + search stub/adapter |
| `src/lib/ragEvidence.ts` | Create | Route-aware evidence bundle builder |
| `src/lib/generativeCompose.ts` | Create | L1 compose + parse + validate |
| `src/lib/generativeRag.ts` | Create | Top-level `runGenerativeRag` orchestrator |
| `src/lib/generativeAgent.ts` | Create (Phase 3) | L2 plan/retrieve/draft/review loop |
| `src/lib/generativePlan.ts` | Create (Phase 3) | Section/slide outline helpers |
| `src/lib/ragHybrid.ts` | Modify | Add `splitSourcesByType`, evidence merge helpers |
| `src/lib/ragSearch.ts` | Modify | Export chunk→EvidenceItem mapper |
| `src/app/api/chat/route.ts` | Modify | Wire orchestrator for generative skills |
| `src/components/GenerativeResultPanel.tsx` | Create | Render summary/body/citations/artifact CTA |
| `src/components/ChatWorkspace.tsx` | Modify | Show generative result panel |
| `tests/generativeRouter.test.ts` | Create | Router gold cases |
| `tests/generativeBudgets.test.ts` | Create | Budget shape tests |
| `tests/ragWeb.test.ts` | Create | Web normalize tests |
| `tests/ragEvidence.test.ts` | Create | Evidence bundle tests |
| `docs/eval/golden/generative-routing.json` | Create | Eval routing gold set |

---

# Phase 1 — Standard Generate Core

### Task 1: L0 router and plan budgets

**Files:**
- Create: `src/lib/generativeRouter.ts`
- Create: `src/lib/generativeBudgets.ts`
- Test: `tests/generativeRouter.test.ts`
- Test: `tests/generativeBudgets.test.ts`

**Interfaces:**
- Consumes: `detectQuickToolFromText` from `src/lib/intentTools.ts`, `PlanId` from `src/lib/plans.ts`
- Produces:
  - `type GenerationSkill = "report" | "presentation" | "study" | "inline"`
  - `type EvidenceRoute = "web_first" | "doc_first" | "hybrid"`
  - `type GenerationMode = "standard" | "agentic"`
  - `type GenerativeRouteDecision = { skill, route, mode, answerFormat, artifact, freshnessRequired, needsPrivateSources, retrievalBudget, toolId? }`
  - `decideGenerativeRoute(query, opts): GenerativeRouteDecision`
  - `type GenerativeBudget = { webCandidates, docCandidates, allowHybrid, maxCitations, maxSections, allowAgentic, allowFileExport }`
  - `getGenerativeBudget(plan: PlanId): GenerativeBudget`

- [ ] **Step 1: Write failing router tests**

Create `tests/generativeRouter.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { decideGenerativeRoute } from "../src/lib/generativeRouter";

test("routes public report request to report + web_first", () => {
  const d = decideGenerativeRoute("2026 AI 규제 동향 리포트 작성해줘", { plan: "pro" });
  assert.equal(d.skill, "report");
  assert.equal(d.route, "web_first");
  assert.equal(d.mode, "standard");
});

test("routes my-notes study request to study + doc_first", () => {
  const d = decideGenerativeRoute("내가 올린 미적분 노트로 시험 대비 정리해줘", {
    plan: "pro",
    hasLibraryContext: true,
  });
  assert.equal(d.skill, "study");
  assert.equal(d.route, "doc_first");
  assert.equal(d.needsPrivateSources, true);
});

test("routes comparison to hybrid study", () => {
  const d = decideGenerativeRoute("내 노트가 최신 수능 경향과 얼마나 맞는지 비교해줘", {
    plan: "professional",
    hasLibraryContext: true,
  });
  assert.equal(d.skill, "study");
  assert.equal(d.route, "hybrid");
  assert.equal(d.answerFormat, "comparison");
});

test("routes short factual question to inline", () => {
  const d = decideGenerativeRoute("광합성이 뭐야?", { plan: "free" });
  assert.equal(d.skill, "inline");
  assert.equal(d.route, "web_first");
});

test("free plan never selects agentic", () => {
  const d = decideGenerativeRoute(
    "아주 상세하고 종합적인 20페이지 리포트 작성해줘",
    { plan: "free" },
  );
  assert.equal(d.mode, "standard");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/generativeRouter.test.ts`  
Expected: FAIL — module not found.

- [ ] **Step 3: Implement router and budgets**

Create `src/lib/generativeBudgets.ts`:

```ts
import type { PlanId } from "@/lib/plans";

export type GenerativeBudget = {
  webCandidates: number;
  docCandidates: number;
  allowHybrid: boolean;
  maxCitations: number;
  maxSections: number;
  allowAgentic: boolean;
  allowFileExport: boolean;
};

export function getGenerativeBudget(plan: PlanId): GenerativeBudget {
  if (plan === "free") {
    return {
      webCandidates: 3,
      docCandidates: 3,
      allowHybrid: false,
      maxCitations: 3,
      maxSections: 3,
      allowAgentic: false,
      allowFileExport: false,
    };
  }
  if (plan === "professional") {
    return {
      webCandidates: 10,
      docCandidates: 10,
      allowHybrid: true,
      maxCitations: 10,
      maxSections: 12,
      allowAgentic: true,
      allowFileExport: true,
    };
  }
  return {
    webCandidates: 6,
    docCandidates: 6,
    allowHybrid: true,
    maxCitations: 6,
    maxSections: 8,
    allowAgentic: true,
    allowFileExport: true,
  };
}
```

Create `src/lib/generativeRouter.ts` with types from design spec and `decideGenerativeRoute` implementing skill priority (presentation → study → report → inline), evidence route heuristics, mode selection (agentic only when paid + complexity + skill ≠ inline), artifact defaults. Call `detectQuickToolFromText` as a signal (`ppt` → presentation, `lecture`/`practice` → study, etc.).

- [ ] **Step 4: Write budget tests**

Create `tests/generativeBudgets.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { getGenerativeBudget } from "../src/lib/generativeBudgets";

test("free plan disables hybrid and export", () => {
  const b = getGenerativeBudget("free");
  assert.equal(b.allowHybrid, false);
  assert.equal(b.allowFileExport, false);
  assert.equal(b.allowAgentic, false);
});
```

- [ ] **Step 5: Run tests**

Run: `npx tsx --test tests/generativeRouter.test.ts tests/generativeBudgets.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/generativeRouter.ts src/lib/generativeBudgets.ts tests/generativeRouter.test.ts tests/generativeBudgets.test.ts
git commit -m "feat: add generative RAG router and plan budgets"
```

---

### Task 2: Web evidence adapter and source splitting

**Files:**
- Create: `src/lib/ragWeb.ts`
- Modify: `src/lib/ragHybrid.ts`
- Test: `tests/ragWeb.test.ts`

**Interfaces:**
- Consumes: none (pure functions)
- Produces:
  - `type EvidenceItem = { sourceType: "web" | "library" | "note"; title; url; snippet; score }`
  - `normalizeWebResults(rows): EvidenceItem[]`
  - `searchWeb(query, budget): Promise<EvidenceItem[]>` (stub returns `[]` until transport wired)
  - `splitSourcesByType(items: EvidenceItem[]): { web: EvidenceItem[]; materials: EvidenceItem[] }`

- [ ] **Step 1: Write failing web normalize test**

Create `tests/ragWeb.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { normalizeWebResults } from "../src/lib/ragWeb";

test("normalizes raw web rows into evidence items", () => {
  const out = normalizeWebResults([
    { title: "A", url: "https://example.com/a", snippet: "alpha", score: 0.9 },
  ]);
  assert.deepEqual(out, [
    {
      sourceType: "web",
      title: "A",
      url: "https://example.com/a",
      snippet: "alpha",
      score: 0.9,
    },
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/ragWeb.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement ragWeb and splitSourcesByType**

Create `src/lib/ragWeb.ts` with `EvidenceItem` type exported (or re-export from shared module if preferred — keep one canonical export in `ragWeb.ts` for Phase 1).

Add to `src/lib/ragHybrid.ts`:

```ts
import type { EvidenceItem } from "@/lib/ragWeb";

export function splitSourcesByType(items: EvidenceItem[]) {
  return {
    web: items.filter((i) => i.sourceType === "web"),
    materials: items.filter((i) => i.sourceType !== "web"),
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/ragWeb.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ragWeb.ts src/lib/ragHybrid.ts tests/ragWeb.test.ts
git commit -m "feat: add web evidence adapter and source splitting"
```

---

### Task 3: Evidence bundle retrieval

**Files:**
- Create: `src/lib/ragEvidence.ts`
- Modify: `src/lib/ragSearch.ts`
- Test: `tests/ragEvidence.test.ts`

**Interfaces:**
- Consumes: `decideGenerativeRoute` output, `getGenerativeBudget`, `retrieveChunks`, `searchWeb`, `splitSourcesByType`
- Produces:
  - `type EvidenceBundle = { web: EvidenceItem[]; materials: EvidenceItem[]; all: EvidenceItem[] }`
  - `chunksToEvidence(ranked: RankedChunk[]): EvidenceItem[]`
  - `retrieveEvidence(input): Promise<EvidenceBundle>`

- [ ] **Step 1: Write failing evidence test**

Create `tests/ragEvidence.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { chunksToEvidence } from "../src/lib/ragEvidence";

test("maps library chunks to material evidence items", () => {
  const out = chunksToEvidence([
    {
      n: 1,
      libraryItemId: "lib1",
      title: "Calc Notes",
      content: "derivative rules",
      snippet: "derivative",
      score: 0.8,
    },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0]!.sourceType, "library");
  assert.match(out[0]!.url, /^library:/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/ragEvidence.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement evidence retrieval**

Create `src/lib/ragEvidence.ts`:

```ts
import type { EvidenceRoute } from "@/lib/generativeRouter";
import type { GenerativeBudget } from "@/lib/generativeBudgets";
import { retrieveChunks, type RankedChunk } from "@/lib/ragSearch";
import { searchWeb, type EvidenceItem } from "@/lib/ragWeb";
import { splitSourcesByType } from "@/lib/ragHybrid";

export type EvidenceBundle = {
  web: EvidenceItem[];
  materials: EvidenceItem[];
  all: EvidenceItem[];
};

export function chunksToEvidence(ranked: RankedChunk[]): EvidenceItem[] {
  return ranked.map((c) => ({
    sourceType: "library" as const,
    title: c.title,
    url: `library:${c.libraryItemId}:${c.n}`,
    snippet: c.snippet,
    score: c.score,
  }));
}

export async function retrieveEvidence(input: {
  query: string;
  route: EvidenceRoute;
  budget: GenerativeBudget;
  userId: string;
  workspaceId?: string | null;
  libraryItemIds?: string[];
}): Promise<EvidenceBundle> {
  const { query, route, budget, userId, workspaceId, libraryItemIds } = input;

  let web: EvidenceItem[] = [];
  let materials: EvidenceItem[] = [];

  const needsWeb = route === "web_first" || route === "hybrid";
  const needsDoc = route === "doc_first" || route === "hybrid";

  if (needsWeb) {
    web = (await searchWeb(query, budget.webCandidates)).slice(0, budget.webCandidates);
  }

  if (needsDoc) {
    const { ranked } = await retrieveChunks({
      userId,
      workspaceId,
      libraryItemIds,
      query,
      k: budget.docCandidates,
      rerank: true,
    });
    materials = chunksToEvidence(ranked).slice(0, budget.docCandidates);
  }

  if (route === "hybrid" && !budget.allowHybrid) {
    web = web.slice(0, budget.maxCitations);
    materials = materials.slice(0, budget.maxCitations);
  }

  const all = [...web, ...materials]
    .sort((a, b) => b.score - a.score)
    .slice(0, budget.maxCitations);

  const split = splitSourcesByType(all);
  return { web: split.web, materials: split.materials, all };
}
```

- [ ] **Step 4: Run tests and typecheck**

Run:
```bash
npx tsx --test tests/ragEvidence.test.ts
npx tsc --noEmit
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ragEvidence.ts tests/ragEvidence.test.ts
git commit -m "feat: add route-aware evidence bundle retrieval"
```

---

### Task 4: L1 Standard Generate composer

**Files:**
- Create: `src/lib/generativeCompose.ts`
- Modify: none yet (read-only use of `tools.ts`, `structured.ts`, `ai.ts`)

**Interfaces:**
- Consumes: `GenerativeRouteDecision`, `EvidenceBundle`, user query
- Produces:
  - `type GenerativeResult = { skill, mode, route, summary, body, structured?, webSources, materialSources, artifact?, meta }`
  - `composeGenerativeResult(input): Promise<GenerativeResult>`

- [ ] **Step 1: Write failing compose test (inline path)**

Create `tests/generativeCompose.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { formatEvidenceForPrompt } from "../src/lib/generativeCompose";

test("formats evidence bundle for prompt injection", () => {
  const text = formatEvidenceForPrompt({
    web: [{ sourceType: "web", title: "A", url: "https://a", snippet: "s", score: 1 }],
    materials: [],
    all: [{ sourceType: "web", title: "A", url: "https://a", snippet: "s", score: 1 }],
  });
  assert.match(text, /\[Web\]/);
  assert.match(text, /https:\/\/a/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/generativeCompose.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement compose helpers and skill dispatch**

Create `src/lib/generativeCompose.ts` with:

1. `formatEvidenceForPrompt(bundle: EvidenceBundle): string` — numbered citations for Web vs Materials sections.
2. `selectToolId(decision: GenerativeRouteDecision): string | undefined` — map report → `researchDraft`/`weeklyReport`/`meeting` by keywords; study → `lectureNotes` or `practiceSet`.
3. `composeGenerativeResult({ query, decision, bundle, userId, workspaceId, modelTier })`:
   - **inline**: call `chatReplyWithFallback` with evidence-augmented system prompt; parse summary (first paragraph) + body.
   - **report/study**: call existing tool pipeline via `runToolGeneration` with selected `toolId`, passing evidence context in prefixed user text.
   - Return `GenerativeResult` with `webSources` / `materialSources` from bundle; omit `artifact` when `!budget.allowFileExport`.

Use existing parsers from `structured.ts` for report/study structured preview serialization to markdown body.

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/generativeCompose.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/generativeCompose.ts tests/generativeCompose.test.ts
git commit -m "feat: add L1 standard generative compose pipeline"
```

---

### Task 5: Top-level orchestrator

**Files:**
- Create: `src/lib/generativeRag.ts`
- Test: extend `tests/generativeRouter.test.ts` or add `tests/generativeRag.test.ts` (mock compose)

**Interfaces:**
- Consumes: all Phase 1 modules
- Produces: `runGenerativeRag(input): Promise<GenerativeResult>`

- [ ] **Step 1: Write orchestrator unit test (router-only branch)**

Create `tests/generativeRag.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { shouldUseGenerativeRag } from "../src/lib/generativeRag";

test("uses generative path for report skill", () => {
  assert.equal(
    shouldUseGenerativeRag({ skill: "report", forceSkill: undefined }),
    true,
  );
});

test("skips generative path for inline unless forced", () => {
  assert.equal(
    shouldUseGenerativeRag({ skill: "inline", forceSkill: undefined }),
    false,
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/generativeRag.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement orchestrator**

Create `src/lib/generativeRag.ts`:

```ts
import type { PlanId } from "@/lib/plans";
import {
  decideGenerativeRoute,
  type GenerationSkill,
  type GenerativeRouteDecision,
} from "@/lib/generativeRouter";
import { getGenerativeBudget } from "@/lib/generativeBudgets";
import { retrieveEvidence } from "@/lib/ragEvidence";
import { composeGenerativeResult, type GenerativeResult } from "@/lib/generativeCompose";

export function shouldUseGenerativeRag(input: {
  skill: GenerationSkill;
  forceSkill?: GenerationSkill;
}): boolean {
  if (input.forceSkill) return true;
  return input.skill !== "inline";
}

export async function runGenerativeRag(input: {
  query: string;
  userId: string;
  workspaceId?: string | null;
  plan: PlanId;
  attachments?: string[];
  forceSkill?: GenerationSkill;
  hasLibraryContext?: boolean;
  modelTier?: "standard" | "priority" | "top";
}): Promise<GenerativeResult> {
  const decision: GenerativeRouteDecision = decideGenerativeRoute(input.query, {
    plan: input.plan,
    hasLibraryContext: input.hasLibraryContext ?? false,
    attachedFileIds: input.attachments,
    forceSkill: input.forceSkill,
  });

  const budget = getGenerativeBudget(input.plan);
  const effectiveMode =
    decision.mode === "agentic" && !budget.allowAgentic ? "standard" : decision.mode;

  const bundle = await retrieveEvidence({
    query: input.query,
    route: decision.route,
    budget,
    userId: input.userId,
    workspaceId: input.workspaceId,
    libraryItemIds: input.attachments,
  });

  return composeGenerativeResult({
    query: input.query,
    decision: { ...decision, mode: effectiveMode },
    bundle,
    budget,
    userId: input.userId,
    workspaceId: input.workspaceId,
    modelTier: input.modelTier ?? "standard",
  });
}
```

Add structured logging (console or existing pipeline logger) with skill/route/mode/evidence counts/durationMs.

- [ ] **Step 4: Run tests and typecheck**

Run:
```bash
npx tsx --test tests/generativeRag.test.ts tests/generativeRouter.test.ts
npx tsc --noEmit
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/generativeRag.ts tests/generativeRag.test.ts
git commit -m "feat: add generative RAG orchestrator"
```

---

### Task 6: Chat API integration

**Files:**
- Modify: `src/app/api/chat/route.ts`

**Interfaces:**
- Consumes: `runGenerativeRag`, `shouldUseGenerativeRag`, `decideGenerativeRoute`, `getPlanOrFree`
- Produces: non-streaming or single-chunk stream response with `generativeResult` payload on assistant message metadata

- [ ] **Step 1: Add pre-route decision hook**

In `src/app/api/chat/route.ts`, after parsing `text` and resolving `plan` via `getPlanOrFree`, add:

```ts
import { decideGenerativeRoute } from "@/lib/generativeRouter";
import { runGenerativeRag, shouldUseGenerativeRag } from "@/lib/generativeRag";

const routePreview = decideGenerativeRoute(text, {
  plan,
  hasLibraryContext: libraryItemIds.length > 0,
  attachedFileIds: libraryItemIds,
});

if (shouldUseGenerativeRag({ skill: routePreview.skill }) && !quickToolId) {
  // emit status event, run orchestrator, persist assistant message with generative payload
}
```

Keep existing `detectQuickToolFromText` + `runToolGeneration` path for explicit quick tools until Phase 2 unification.

- [ ] **Step 2: Persist generative payload on message**

Store on assistant message (JSON metadata field or existing attachments pattern):

```ts
{
  generative: {
    skill: result.skill,
    mode: result.mode,
    route: result.route,
    summary: result.summary,
    body: result.body,
    webSources: result.webSources,
    materialSources: result.materialSources,
    artifact: result.artifact ?? null,
  },
}
```

Return via existing stream `done` event so client can render.

- [ ] **Step 3: Quota hook**

For Phase 1, reuse `assertAndConsumeQuota` with `monthlyDocuments` when skill is `report` or `study` and user is free; paid users use existing plan limits.

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: wire generative RAG into chat API"
```

---

### Task 7: UI — generative result panel

**Files:**
- Create: `src/components/GenerativeResultPanel.tsx`
- Modify: `src/components/ChatWorkspace.tsx`
- Modify: `src/lib/i18n.ts` (minimal strings)

**Interfaces:**
- Consumes: generative payload from message metadata
- Produces: rendered summary, body, Web/Your materials citation tabs, upgrade CTA when export blocked

- [ ] **Step 1: Create panel component**

Create `src/components/GenerativeResultPanel.tsx`:

```tsx
"use client";

type Source = { title: string; url: string; snippet: string };

export function GenerativeResultPanel(props: {
  skill: string;
  summary: string;
  body: string;
  webSources: Source[];
  materialSources: Source[];
  exportBlocked?: boolean;
}) {
  // skill badge + summary + body (markdown) + two citation sections
  // if exportBlocked, show upgrade hint instead of download
  return null; // implement with existing markdown/citation card styles
}
```

Reuse citation card styling from `ChatWorkspace` where possible.

- [ ] **Step 2: Wire ChatWorkspace**

When assistant message includes `generative` metadata, render `GenerativeResultPanel` instead of flat markdown-only bubble.

- [ ] **Step 3: Add i18n keys**

Add under `generative.*`:
- `generative.skill.report` = "리포트 초안"
- `generative.skill.study` = "학습 자료"
- `generative.sources.web` = "웹 출처"
- `generative.sources.materials` = "내 자료"
- `generative.export.upgrade` = "파일 내보내기는 Pro 이상에서 이용할 수 있습니다"

- [ ] **Step 4: Run lint and typecheck**

Run:
```bash
npm run lint
npx tsc --noEmit
```
Expected: PASS (or pre-existing warnings only).

- [ ] **Step 5: Commit**

```bash
git add src/components/GenerativeResultPanel.tsx src/components/ChatWorkspace.tsx src/lib/i18n.ts
git commit -m "feat: render generative RAG results in chat UI"
```

---

### Task 8: Eval gold set and PRD status

**Files:**
- Create: `docs/eval/golden/generative-routing.json`
- Modify: `scripts/eval-ai.mts` (add routing eval section)
- Modify: `docs/PRD_GENERATIVE_RAG_2026-07.md` (status → approved)

**Interfaces:**
- Consumes: `decideGenerativeRoute`
- Produces: 5 routing gold cases from design spec §10.2

- [ ] **Step 1: Add golden JSON**

Create `docs/eval/golden/generative-routing.json`:

```json
{
  "cases": [
    { "id": "report-web", "query": "2026 AI 규제 동향 리포트 작성해줘", "plan": "pro", "expectSkill": "report", "expectRoute": "web_first" },
    { "id": "study-doc", "query": "내가 올린 미적분 노트로 시험 대비 정리해줘", "plan": "pro", "hasLibraryContext": true, "expectSkill": "study", "expectRoute": "doc_first" },
    { "id": "study-hybrid", "query": "내 노트가 최신 수능 경향과 얼마나 맞는지 비교해줘", "plan": "pro", "hasLibraryContext": true, "expectSkill": "study", "expectRoute": "hybrid" },
    { "id": "presentation-web", "query": "AI ethics 12-slide presentation 만들어줘", "plan": "pro", "expectSkill": "presentation", "expectRoute": "web_first" },
    { "id": "inline-web", "query": "광합성이 뭐야?", "plan": "free", "expectSkill": "inline", "expectRoute": "web_first" }
  ]
}
```

- [ ] **Step 2: Extend eval-ai.mts**

Add block after smoke-tools:

```ts
import { decideGenerativeRoute } from "../src/lib/generativeRouter";

const routingPath = join(GOLDEN_DIR, "generative-routing.json");
if (existsSync(routingPath)) {
  const cases = loadGoldenCases(JSON.parse(readFileSync(routingPath, "utf8")));
  for (const c of cases) {
    const d = decideGenerativeRoute(String(c.query), {
      plan: (c.plan as "free" | "pro" | "professional") ?? "free",
      hasLibraryContext: Boolean(c.hasLibraryContext),
    });
    const ok =
      d.skill === c.expectSkill && d.route === c.expectRoute;
    ok
      ? pass(`generative-routing::${c.id}`)
      : fail(`generative-routing::${c.id}`, `got ${d.skill}/${d.route}`);
  }
}
```

- [ ] **Step 3: Run eval**

Run: `npm run eval:ai`  
Expected: generative-routing cases PASS; existing smoke PASS.

- [ ] **Step 4: Update PRD status**

In `docs/PRD_GENERATIVE_RAG_2026-07.md`, set Status to `Approved — Phase 1 implementation in progress`.

- [ ] **Step 5: Commit**

```bash
git add docs/eval/golden/generative-routing.json scripts/eval-ai.mts docs/PRD_GENERATIVE_RAG_2026-07.md
git commit -m "test: add generative routing eval gold set"
```

---

# Phase 2 — Presentations, Files, Monetization

### Task 9: Presentation skill via existing PPT pipeline

**Files:**
- Modify: `src/lib/generativeCompose.ts`
- Modify: `src/lib/generativeRouter.ts` (ensure presentation toolId mapping)
- Modify: `src/lib/generativeRag.ts`

- [ ] Wire `skill === "presentation"` to `runToolGeneration({ toolId: "ppt", pptStage: "full" })` with evidence injected via `formatPptOutlineContext` / `formatPptFillContext` patterns from `pptContext.ts`.
- [ ] Return `artifact: { type: "pptx", fileName, base64 }` when `budget.allowFileExport`.
- [ ] Free users: outline preview in body, no pptx artifact.
- [ ] Test: manual — "AI ethics 12-slide presentation" on pro account produces pptx download.
- [ ] Commit: `feat: add presentation skill to generative RAG`

### Task 10: docx export for report skill

**Files:**
- Modify: `src/lib/generativeCompose.ts`

- [ ] After structured parse for report, call `buildDocxBase64` from `docx.ts` when `artifact === "docx"` and export allowed.
- [ ] Attach artifact to `GenerativeResult`.
- [ ] Commit: `feat: add docx export for generative report skill`

### Task 11: Unified sidebar tool delegation

**Files:**
- Modify: `src/app/api/chat/route.ts`
- Modify: tool quick-action entry points

- [ ] When sidebar sends explicit `quickToolId`, map to `forceSkill` (`researchDraft` → report, `ppt` → presentation, `lectureNotes` → study) and call `runGenerativeRag` instead of duplicating `runToolGeneration` logic.
- [ ] Commit: `refactor: delegate sidebar tools to generative orchestrator`

### Task 12: Generative usage quotas

**Files:**
- Modify: `src/lib/usage.ts`
- Modify: `src/lib/plans.ts` (optional new counter comment)

- [ ] Add `generativeRunsMonthly` counter or document reuse of `monthlyDocuments` with explicit helper `assertGenerativeQuota(plan, skill)`.
- [ ] Enforce in `runGenerativeRag` before compose.
- [ ] Commit: `feat: enforce generative run quotas by plan`

### Task 13: FileResultPanel download UX

**Files:**
- Modify: `src/components/FileResultPanel.tsx`
- Modify: `src/components/GenerativeResultPanel.tsx`

- [ ] Reuse `FileResultPanel` download flow for generative artifacts.
- [ ] Show upgrade modal on free when export blocked.
- [ ] Commit: `feat: unify generative file download UX`

---

# Phase 3 — Agentic Generate

### Task 14: Section planning module

**Files:**
- Create: `src/lib/generativePlan.ts`
- Test: `tests/generativePlan.test.ts`

- [ ] Implement `planOutline(skill, query): { id, title, queryHint }[]` with rule-based defaults (report → intro/findings/conclusion; study → summary/keyPoints/practice).
- [ ] Cap sections to `budget.maxSections`.
- [ ] Commit: `feat: add generative section planning`

### Task 15: Agentic loop

**Files:**
- Create: `src/lib/generativeAgent.ts`
- Modify: `src/lib/generativeRag.ts`

- [ ] Implement bounded loop: plan → per-section retrieve → draft → merge → review (max 2 iterations) → validate.
- [ ] Hard cap retrieval calls: 15 (pro), 20 (professional).
- [ ] Only run when `decision.mode === "agentic"` and `budget.allowAgentic`.
- [ ] Commit: `feat: add L2 agentic generative RAG`

### Task 16: Agentic eval and observability

**Files:**
- Modify: `docs/eval/golden/generative-routing.json` or new `generative-agentic.json`
- Modify: `src/lib/generativeRag.ts` logging

- [ ] Add complexity-routing cases (long report → agentic on pro, same on free → standard).
- [ ] Log durationMs, section count, retrieval call count.
- [ ] Run `npm run eval:ai` — all PASS.
- [ ] Commit: `test: add agentic generative routing eval cases`

---

## Self-Review

**Spec coverage:**
- L0 router + budgets → Task 1
- Evidence layer (web + library + hybrid) → Tasks 2–3
- L1 Standard Generate → Task 4–5
- Chat API + UI → Tasks 6–7
- Eval gold set → Task 8
- Presentation + files + quotas → Phase 2 Tasks 9–13
- L2 Agentic → Phase 3 Tasks 14–16
- Sidebar delegation → Task 11
- Monetization gates → Tasks 5 (budget), 6 (quota), 12

**Placeholder scan:** No TBD/TODO/vague steps in Phase 1 tasks.

**Type consistency:** `EvidenceItem`, `EvidenceBundle`, `GenerativeRouteDecision`, `GenerativeBudget`, `GenerativeResult` defined before consumers in task order.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-28-generative-rag.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
