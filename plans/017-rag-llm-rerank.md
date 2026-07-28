# Plan 017: RAG LLM rerank (top-20 → top-k)

> **Drift check**: `git diff --stat HEAD -- src/lib/ragSearch.ts src/lib/ragRerank.ts src/lib/zeffContext.ts`

## Status

- **Priority**: P1 | **Effort**: M | **Risk**: MED | **Depends on**: 010 | **Planned at**: `c6a6bf4` | **Done**: 2026-07-28

## Why this matters

Plan 010 shipped threshold + web fallback. PRD §5 remaining option:

| # | Approach | Status |
|---|----------|--------|
| 1 | Relevance threshold ≥ 0.35 | DONE (010) |
| 2 | **LLM rerank top-20 → top-3** | **This plan** |
| 3 | Web search fallback | DONE (010) |

## Scope

**In scope:**
- Hybrid pool (`RAG_RERANK_POOL`, default 20) after score gate
- Cheap-model LLM reorder via `parseRerankOrder` + `rerankChunks`
- Fail-open to hybrid order; `RAG_RERANK=0` disables
- Chat context `RAG_TOP_K=3`

**Out of scope:**
- Dedicated cross-encoder model hosting
- Charging quota for rerank calls (best-effort cheap path)

## Done criteria

- [x] `retrieveChunks` can rerank pool → top-k
- [x] Golden parse cases for rerank JSON
- [x] lint / tsc / eval:ai pass
