# Unified RAG - Design Spec

Companion to `docs/PRD_UNIFIED_RAG_2026-07.md`.

## Product shape

One input box, one answer flow, three internal routes:

- `web_first`
- `doc_first`
- `hybrid`

User should not manually choose the route in MVP.

## Output contract

All answers produce:

1. summary
2. main answer
3. citations split into:
   - Web
   - Your materials

## Format auto-selection

The presenter should choose one of these based on the question:

- `compact_fact`
- `explanatory`
- `comparison`
- `study_helper`

This is a formatting decision, not a separate retrieval mode.

## Retrieval budgets

### Free

- small web candidate count
- small doc candidate count
- reduced or partially disabled hybrid path
- short answer budget

### Pro / Professional

- expanded web candidates
- expanded doc candidates
- full hybrid support
- larger answer budget

Professional can later receive deeper retrieval depth than Pro, but MVP may keep the same route set and only vary budget.

## Router responsibilities

Router predicts:

- freshness need
- whether user material is required
- answer depth
- best answer format

Output shape example:

```ts
type RagRoute = "web_first" | "doc_first" | "hybrid";
type AnswerFormat = "compact_fact" | "explanatory" | "comparison" | "study_helper";

type RouteDecision = {
  route: RagRoute;
  freshnessRequired: boolean;
  needsPrivateSources: boolean;
  answerFormat: AnswerFormat;
  retrievalBudget: "free" | "paid";
};
```

## Retrieval stages

### web_first

- perform web search
- normalize result metadata
- filter obvious low-trust or duplicate items
- optionally enrich with small private-material lookup

### doc_first

- search indexed library chunks
- return chunk text + source labels + file metadata

### hybrid

- run both retrieval paths
- combine candidates into a shared reranker

## Citation model

Each evidence item should carry:

- `sourceType`: `web` | `library` | `note`
- `title`
- `url` or internal library identifier
- short snippet

UI groups them into:

- Web
- Your materials

## Existing codebase fit

The codebase already has:

- document-search UI strings
- indexing/search error copy
- prior RAG upgrade docs
- reindex guidance

So this project should extend the current RAG substrate rather than introduce a parallel product.

## MVP phases

### Phase 1

- expose web-first retrieval path
- reuse existing doc retrieval as support
- show split citations

### Phase 2

- add router
- add hybrid reranking
- add plan-based retrieval budgets

### Phase 3

- tune route heuristics and answer formatting
- add evaluation dataset for source-priority correctness
