# PRD: Unified RAG (Web + Documents + Notes)

| Field | Value |
|-------|--------|
| **Status** | **Superseded** — see `docs/PRD_GENERATIVE_RAG_2026-07.md` (Approach 3) |
| **Date** | 2026-07-28 |
| **Scope** | New product RAG flow on top of existing document/library retrieval |
| **Primary mode** | Web-first, documents/notes as supporting evidence |
| **Audience** | Free users (limited), Pro/Professional users (full) |
| **Default answer shape** | Summary -> main answer -> sources |
| **Format behavior** | Auto-select presentation style by question type |

---

## 1. Executive Summary

ZEFF AI already contains document-search and library-grounded retrieval components. This project extends that base into a **unified multi-source RAG experience** that can answer from:

- live or recent **web sources**
- uploaded **documents**
- user **notes / library material**

The approved direction is **web-first retrieval**, with private/library material used as supporting context rather than the default primary source. The product should feel balanced across quality, speed, and citations, and support clear feature separation between free and paid plans.

---

## 2. Problem

Current RAG capabilities are centered on searchable uploaded material and internal retrieval improvements. That is useful when a user already has relevant documents, but insufficient for mixed questions such as:

- "What changed recently, and how does that compare to my notes?"
- "Summarize the latest public info, then ground it against my uploaded material."
- "Use web results for freshness, but show me where my own materials differ."

Without a unified flow:

- users must switch between search modes mentally
- freshness and personal context are not combined cleanly
- monetization levers for free vs paid RAG remain shallow

---

## 3. Product Goal

Build a question-answering flow that:

1. decides whether a question needs web, private docs, or both
2. answers in a consistent structure
3. separates citations by source class
4. limits free users while making paid plans clearly more capable

---

## 4. Approved Product Decisions

| Topic | Decision |
|-------|----------|
| Retrieval priority | **Web first** |
| Documents/notes role | Supporting evidence |
| Answer quality target | Balanced (quality + speed + citations) |
| Answer layout | **Summary -> body -> sources** |
| Display behavior | Auto-select formatting by question type |
| Monetization | Free limited, paid full |

---

## 5. User Experience

### Core interaction

User asks one question. The system decides internally whether it is:

- `web_first`
- `doc_first`
- `hybrid`

The user does not need to pick the mode manually.

### Output structure

Default answer structure:

1. **Summary**
2. **Main answer**
3. **Sources**
   - Web
   - Your materials

### Adaptive formatting

The system may adjust presentation by question type:

- short factual query -> compact answer
- comparison / analysis -> sectioned answer
- study question -> explanatory answer with examples
- personal-material question -> stronger snippet emphasis

---

## 6. Retrieval Model

### Step 1 - Query router

A routing stage classifies the incoming question and predicts:

- freshness requirement
- whether user-private material matters
- desired answer depth
- best response format

### Step 2 - Source retrieval

#### Web-first

- query external web search
- fetch/rank recent public sources
- derive compact evidence set

#### Doc-first

- search library chunks / notes / uploaded material
- recover chunks + metadata + source labels

#### Hybrid

- run web retrieval and document retrieval together
- merge candidates into one reranking stage

### Step 3 - Reranking

Final ranking should consider:

- semantic relevance
- freshness
- source trust
- user-material proximity
- duplication removal

### Step 4 - Answer composition

Compose one answer with explicit source separation so the user can see which parts came from public web vs private material.

---

## 7. Free vs Paid

### Free

- lower retrieval budget
- fewer web results
- smaller document candidate set
- shorter answers
- fewer citations
- hybrid mode may be limited or partially disabled

### Paid (Pro / Professional)

- larger retrieval budget
- broader hybrid retrieval
- more citations
- longer answers
- stronger comparison / analysis formatting

Professional may later receive:

- deeper retrieval depth
- larger answer budget
- more source windows per answer

---

## 8. Why This Architecture

### Why not pure web RAG

Pure web RAG loses the user's private context and makes library uploads less valuable.

### Why not equal-weight multi-source by default

The approved product direction is web-first. Equal weighting would reduce the "freshness first" behavior the user requested.

### Why router-based retrieval

Routing gives:

- better latency control
- better paid/free feature gating
- easier future tuning than a single always-hybrid path

---

## 9. MVP Boundary

### In scope for MVP

- router (`web_first`, `doc_first`, `hybrid`)
- web-first retrieval
- supporting library/doc retrieval
- answer format `summary -> body -> sources`
- source-class-separated citations
- free/paid retrieval limits

### Out of scope for MVP

- enterprise connectors
- workspace-wide org knowledge graph
- multimodal note graph reasoning
- autonomous deep research chains
- long-running report agents over many retrieval rounds

---

## 10. Key Risks

| Risk | Why it matters | Mitigation |
|------|----------------|------------|
| Router misclassification | Wrong source mix reduces quality | Log route decisions and evaluate against gold questions |
| Web source quality variance | Low-trust pages can dominate | Apply trust heuristics and citation filtering |
| Hybrid latency | Parallel retrieval can get slow | Cap budgets by plan and route only when needed |
| Free plan abuse | Expensive web-heavy queries | Tight free limits + rate limits + answer budget caps |
| Citation confusion | User may not know what came from where | Separate "Web" and "Your materials" sections visually |

---

## 11. Acceptance Criteria

- User can ask one question without choosing retrieval mode manually.
- System routes between `web_first`, `doc_first`, and `hybrid`.
- Answer includes summary, main answer, and separated citations.
- Free and paid plans behave differently in measurable retrieval budgets.
- Hybrid mode works for questions combining recent public info and uploaded materials.

---

## 12. Execution Follow-up

If implementation is approved later, next artifacts should include:

- design spec
- implementation plan
- retrieval budget table by plan
- evaluation set for web-first / hybrid correctness
