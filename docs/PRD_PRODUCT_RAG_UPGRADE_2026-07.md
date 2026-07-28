# PRD: 제품 UX 개선 및 RAG 엔진 고도화

| Field | Value |
|-------|--------|
| **Status** | v1 — executable plans ready |
| **Date** | 2026-07-28 |
| **Planned at** | commit `a78c6d6` |
| **Executable plans** | [`plans/020`](../plans/020-landing-ux-noto-login-skills.md), [`plans/021`](../plans/021-rag-engine-upgrade.md) |
| **Supersedes (visual)** | nothing-design cream/red/Doto on landing (`plans/005`) — **deliberate reverse** |

---

## Defaults (confirmed for planning)

| Decision | Choice |
|----------|--------|
| Execution | **Phased**: Plan 020 (UX + landing) → Plan 021 (RAG) |
| `/design` · Higgsfield | **Marketing only** — landing skill card + copy; no live Higgsfield integration in this wave |
| Design direction | Noto Sans KR, white/light gray shell, blue CTA `#2563EB`, remove digital `01` labels |

---

## 1. Design & visual language

| Requirement | Current (gap) | Target |
|-------------|----------------|--------|
| Font | Landing: Space Grotesk + Doto; app: Geist | **Noto Sans KR** primary on landing + app body |
| Background | Landing cream `#f5f3ee` | White `#FFFFFF` or very light gray |
| Hero CTA | Red `#d71921` | Blue `#2563EB` |
| Digital chrome | Hero `01` (Doto), showcase `01`–`04` | Remove |

**Key files:** [`src/app/globals.css`](../src/app/globals.css), [`src/app/layout.tsx`](../src/app/layout.tsx), [`src/components/landing/Hero.tsx`](../src/components/landing/Hero.tsx), [`FeatureShowcase.tsx`](../src/components/landing/FeatureShowcase.tsx)

---

## 2. User journey & UI simplification

| Requirement | Gap | Target |
|-------------|-----|--------|
| Login screen | Full OAuth + credentials + 2FA, blue SaaS chrome, Image-only logo | Minimal inputs; brand `Logo`; align tokens |
| Duplicate CTA | Hero always `/login`; header logged-in → `/app` | Session-aware hero; remove duplicate “웹에서 시작하기” beside login |
| Login loop | Hero → `/login` even when signed in; login ignores `callbackUrl`, web lands `/` | Logged-in → `/app`; honor `callbackUrl`; redirect authenticated users off `/login` |
| Quality tier | 빠름/보통/정밀 above composer | Move into `+` (quick tools) menu |

**Key files:** [`Hero.tsx`](../src/components/landing/Hero.tsx), [`Header.tsx`](../src/components/landing/Header.tsx), [`login/page.tsx`](../src/app/login/page.tsx), [`proxy.ts`](../src/proxy.ts) or middleware, [`ChatWorkspace.tsx`](../src/components/ChatWorkspace.tsx)

---

## 3. Core skills marketing (slim landing)

Compress long feature storytelling into **~2 viewport sections** centered on three skills:

| Skill | Pitch | Implementation this wave |
|-------|-------|--------------------------|
| 콘텐츠 자동화 (`/design`) | Instagram carousel planning → copy → image (Higgsfield) | **Marketing card + optional `/design` placeholder page** (coming soon / waitlist). No API integration. |
| STEM 전문 분석 | Science/math/engineering explainers + clean diagrams | Marketing card; deep-link existing math-solve / diagram tools where possible |
| 지능형 리포트 | Library-grounded weekly/report drafts | Marketing card; deep-link existing structured report tools |

Trim or demote: long `WorkLectureScroll` / dense showcase copy. Keep Pricing.

---

## 4. RAG engine — five strategies

| # | Strategy | Current | Plan |
|---|----------|---------|------|
| 1 | Semantic chunking (headers/paragraphs) | **DONE** — header/paragraph pack in [`rag.ts`](../src/lib/rag.ts) | **021** |
| 2 | Hybrid search (vector + BM25-style) | **DONE** — BM25 over candidate set ([`ragHybrid.ts`](../src/lib/ragHybrid.ts)) | **021** |
| 3 | Multi-query expansion | **DONE** — heuristic (+ optional LLM); `RAG_MULTI_QUERY=0` | **021** |
| 4 | Two-stage rerank | **DONE** — chat/PPT/agent/math paths | 017 + **021** |
| 5 | Universal context assembler | **DONE** — zeff/ppt + review flashcards when indexed | **021** |

PRD §5 items from prior overhaul (threshold 0.35, web fallback, LLM rerank) remain shipped (010/017).

**Re-index note:** Existing `DocumentChunk` rows keep old boundaries until the library item is re-uploaded or re-indexed. New uploads use semantic chunking.

---

## 5. Out of scope (this wave)

- Live Higgsfield / Instagram generation pipeline
- Cross-encoder hosting / paid rerank quota
- Reference PPT upload — **DONE** plan 022 (colors) + **023** (fontFace)
- Legal business registration fields (owner-blocked)
- Reverting app dark mode system-wide (landing/login light shell only unless already shared tokens)

---

## 6. Verification baseline

| Command | Expected |
|---------|----------|
| `npm run lint` | exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `npm run eval:ai` | all goldens pass (incl. new RAG cases in 021) |

---

## 7. Execution order

```
020 Landing UX (Noto, white, blue CTA, login loop, + menu quality, 3-skill marketing)
  →
021 RAG engine (semantic chunk, BM25 hybrid, multi-query, assembler coverage, rerank opt-in)
```
