# Plan 021: RAG engine upgrade — semantic chunk, BM25 hybrid, multi-query, assembler

> **Executor instructions**: Follow step by step. Run every verification before the next step. On STOP conditions, stop and report. When done, mark DONE in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a78c6d6..HEAD -- src/lib/rag.ts src/lib/ragHybrid.ts src/lib/ragSearch.ts src/lib/ragRerank.ts src/lib/zeffContext.ts src/app/api/review`

## Status

- **Priority**: P1 | **Effort**: L | **Risk**: MED | **Depends on**: 010, 017, **020** (soft — can start after 020 ships) | **Category**: direction | **Planned at**: `a78c6d6` | **Status**: TODO

## Why this matters

Prior work closed PRD §5 basics (threshold, web fallback, LLM rerank). This plan implements the **five upgrade strategies** in [`docs/PRD_PRODUCT_RAG_UPGRADE_2026-07.md`](../docs/PRD_PRODUCT_RAG_UPGRADE_2026-07.md) §4 so retrieval stays coherent for jargon, vague questions, and non-chat tool paths.

## Current state

| Strategy | Status | File |
|----------|--------|------|
| Semantic chunking | Char 900 + soft `\n\n`/`.` breaks | `src/lib/rag.ts` `chunkText` |
| Hybrid | Vector 0.75 + keyword/bigram 0.25 (not BM25) | `ragHybrid.ts` |
| Multi-query | Missing | — |
| Rerank | DONE; chat+PPT only | `ragRerank.ts`, `zeffContext`, `pptContext` |
| Assembler | Chat+PPT; flashcards raw `slice(0,8000)` | `api/review/generate/route.ts` |

## Scope

**In scope:**

1. **Semantic chunking** — Prefer markdown/ATX headers, blank-line paragraphs, then size cap; keep overlap; re-index note: new uploads use new chunker; document that existing library rows need re-index (admin ZEFF route / user re-upload) — do **not** force full DB migration in this plan unless a safe `rechunk` script already exists
2. **BM25-style keyword leg** — Replace or augment `keywordOverlapScore` with a lightweight BM25 (in-memory over candidate set after vector prefilter) — no external search service
3. **Multi-query expansion** — Cheap LLM (or heuristic) expands user query → 2–3 variants; retrieve per query; merge/dedupe by chunk id before threshold + rerank; kill switch `RAG_MULTI_QUERY=0`
4. **Rerank coverage** — Opt-in `rerank: true` for `agentTools` `knowledge_search` and chat math-solve RAG path (same fail-open)
5. **Universal assembler** — Review/flashcard generation uses `retrieveChunks` (or shared helper) over the source library item instead of blind 8k slice when embeddings exist; fall back to slice if empty index

**Out of scope:**
- Hosted cross-encoder
- Charging quota for expansion/rerank calls
- Changing default `MIN_RETRIEVAL_SCORE` (keep 0.35 unless goldens force micro-tune)

## Steps

### Step 1: Semantic `chunkText`

- Extend `src/lib/rag.ts`: split by `/^#{1,6}\s/m` and `\n\n` first; pack into ≤900 chars with overlap
- Unit/golden: fixture markdown with headers → chunk boundaries respect headers

**Verify**: `npm run eval:ai` includes new `chunk_*` cases OR a small node assert in eval harness.

### Step 2: BM25 hybrid

- Add `bm25Score` in `ragHybrid.ts` (or `ragBm25.ts`); blend into hybrid (keep vector dominant, e.g. 0.7 vec / 0.3 bm25 — document weights)
- Preserve `passesRetrievalThreshold`

**Verify**: Golden hybrid cases still pass; add 1–2 jargon/proper-noun cases where BM25 helps.

### Step 3: Multi-query

- `src/lib/ragMultiQuery.ts`: `expandQueries(query) → string[]` (original + expansions); fail-open to `[query]`
- Wire in `retrieveChunks` behind `RAG_MULTI_QUERY` (default on)

**Verify**: Parse/expand goldens; offline eval green.

### Step 4: Rerank + assembler coverage

- `knowledge_search` + math-solve path: `rerank: isRagRerankEnabled()`
- `review/generate`: if library item has chunks, `retrieveChunks` top-k into prompt; else existing slice

**Verify**: lint/tsc; eval:ai; manual note in plan PR for flashcard path.

### Step 5: Docs

- Update PRD §4 checkboxes; mention re-index recommendation for old library items

## Done criteria

- [ ] Header/paragraph-aware chunking with goldens
- [ ] BM25-style hybrid blended; goldens green
- [ ] Multi-query with kill switch
- [ ] Rerank on agent knowledge_search + math RAG
- [ ] Flashcard/review uses retrieved chunks when indexed
- [ ] `npm run lint` / `npx tsc --noEmit` / `npm run eval:ai` pass

## STOP conditions

- Embedding/index schema cannot store new chunk boundaries without migration — stop and propose migration plan
- Multi-query latency exceeds product budget with no kill switch — must ship kill switch first
