# Plan 010: RAG relevance gate + web search fallback

> **Drift check**: `git diff --stat 9d8b25f..HEAD -- src/lib/ragHybrid.ts src/lib/ragSearch.ts src/lib/zeffContext.ts src/lib/backendRoute.ts src/components/CitationCards.tsx`

## Status

- **Priority**: P1 | **Effort**: L | **Risk**: MED | **Planned at**: `9d8b25f`

## Why this matters

User asked about weapons law; RAG returned passport consent form at 26% score. Default `MIN_RETRIEVAL_SCORE=0.15` (`ragHybrid.ts:3`) is too permissive. No web search when library misses.

## Current state

- `passesRetrievalThreshold` at 0.15
- `assembleRuntimeContext` in `zeffContext.ts` injects RAG chunks without post-filter on max score
- `CitationCards.tsx` — hardcoded “참고 출처”
- No web search module in `src/lib/`

## Recommended approach (from advisor)

**Phase A (P0):** Raise threshold + suppress citations when max score < 0.35  
**Phase B (P0):** Web search fallback for legal/factual queries when RAG empty or low  
**Phase C (P1):** LLM rerank top-20 → top-3

## Scope

**In scope:**
- Env `MIN_RETRIEVAL_SCORE` default → `0.35` (or filter in `zeffContext` after retrieve)
- `shouldUseWebSearch(query)` — legal keywords, current events, or max RAG score < threshold
- `src/lib/webSearch.ts` — wrapper (Gemini grounding or existing fetch pattern; no new API key type without env doc)
- Merge web snippets into system prompt with `[web-n]` tags
- i18n `CitationCards` label

**Out of scope:**
- Re-indexing entire library
- Agent path citation persistence (separate ticket)

## Steps

### Step 1: Threshold gate

In `zeffContext.ts` after `retrieveChunks`:
```ts
if (!ranked.length || ranked[0].score < MIN_CITATION_SCORE) {
  // skip RAG block; set flag for web fallback
}
```

Document `MIN_CITATION_SCORE=0.35` in code constant.

### Step 2: Web search module

Implement `searchWeb(query): Promise<{title, url, snippet}[]>` with 3-result cap.
Integrate in `runBackendRoute` when RAG gate fails OR query classified legal/factual.

### Step 3: CitationCards

Parse both library and web sources in `resultData` JSON schema extension.

**Verify**: Manual — “흉기 소지 법” should not cite passport forms

## Done criteria

- [ ] Irrelevant low-score chunks not shown as citations
- [ ] Legal question without library match uses web context in answer
- [ ] `npm run lint` exit 0

## STOP conditions

- Web search API requires undisclosed API key — stop and document env requirement

## Maintenance notes

Three improvement options documented in README: threshold, rerank, web fallback — implementing 1+3 first
