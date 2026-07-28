# PRD: Generative RAG Platform (Approach 3)

| Field | Value |
|-------|--------|
| **Status** | Approved — Phase 1 implemented |
| **Date** | 2026-07-28 |
| **Supersedes** | `docs/PRD_UNIFIED_RAG_2026-07.md` (retrieval-only scope) |
| **Scope** | Generation-first RAG: reports, presentations, study materials |
| **Architecture** | Layered: router → standard generate → agentic generate |
| **Source strategy** | Auto-select web / documents / hybrid per request |
| **Audience** | Free (trial-like), Pro / Professional (full) |

---

## 1. Executive Summary

ZEFF AI already ships document retrieval, structured generation tools (reports, PPT, lecture notes, practice sets), and file export (docx, pptx, xlsx). This project **redefines RAG as a generation engine**, not a search box.

Users ask one natural-language request. The system:

1. classifies **what to produce** (report, presentation, study pack, or inline answer)
2. selects **where to gather evidence** (web-first, doc-first, or hybrid)
3. runs either **Standard Generate** (search → synthesize → draft) or **Agentic Generate** (plan → iterative retrieval → structure → generate → self-review)
4. delivers a **preview in chat** and, when appropriate, a **downloadable artifact**

The prior unified-RAG PRD focused on answer formatting and citations. This PRD keeps that foundation but elevates **generation skills** as the primary product surface.

---

## 2. Problem

### Retrieval-only RAG is insufficient

Users do not only want “answers with sources.” They want **deliverables**:

- a research report grounded in recent web + their notes
- a presentation deck from a topic or uploaded material
- study materials (summary, Q&A, practice problems) from lectures or documents

Today these flows are fragmented:

- chat RAG answers in one shape
- sidebar tools (PPT, report, lecture notes) in another
- no shared evidence pipeline or citation model across them
- no automatic escalation from simple to complex generation

### Missed product value

Without a unified generative layer:

- web freshness and private library context are not combined into file outputs
- free users cannot experience “full power” in a controlled trial
- paid differentiation stays shallow (more tokens, not better artifacts)

---

## 3. Product Goal

Build a **Layered Generative RAG Platform** where:

| Layer | Role |
|-------|------|
| **L0 — Intent & source router** | Decide output skill + evidence route |
| **L1 — Standard Generate** | Single-pass retrieve → compose → render |
| **L2 — Agentic Generate** | Multi-step plan, retrieve, draft, review for complex jobs |

Success means a user can type one request and receive a **credible, cited, appropriately formatted output** — preview and file when relevant — without manually picking tools or source modes.

---

## 4. Approved Product Decisions

| Topic | Decision |
|-------|----------|
| Primary product shape | **Generation skills** (report, presentation, study) |
| Evidence sources | Web, user documents/notes, or hybrid — **auto-selected** |
| Default evidence priority | **Web-first** when freshness matters; doc-first when user material is explicit |
| Generation modes | **Hybrid ops**: Standard Generate default; Agentic Generate for complex requests |
| Chat output | Summary → body → split citations (Web / Your materials) |
| File output | Auto when skill implies it (docx report, pptx deck, study export) |
| Free plan | **Trial-like**: limited runs, shorter depth, no agentic, capped citations |
| Paid plans | Full Standard + Agentic, deeper retrieval, file export, higher quotas |
| MVP focus | Phase 1: Standard Generate + report/study; Phase 2: presentations + files + tiers; Phase 3: Agentic |

---

## 5. Generation Skills (Product Surface)

### 5.1 Report skill

**Triggers:** research summary, weekly report, meeting minutes, comparative analysis, “write a report on…”

**Outputs:**

- inline structured preview (sections, bullets, tables)
- optional **docx** export

**Evidence:** web-first for public topics; hybrid when comparing to user uploads; doc-first when scoped to “my materials.”

**Reuses:** `structured.ts` kinds (`researchDraft`, `weeklyReport`, `meeting`), `docx.ts`, existing tool definitions in `tools.ts`.

### 5.2 Presentation skill

**Triggers:** “make slides,” “presentation on…,” topic + audience + length

**Outputs:**

- outline preview in chat
- **pptx** file (outline → fill pipeline)

**Evidence:** web for topical decks; doc-first when source is an uploaded lecture or paper; hybrid for “update my deck with latest data.”

**Reuses:** `pptOutline`, `pptx.ts`, `toolGeneration.ts` PPT stages, `pptContext.ts`.

### 5.3 Study materials skill

**Triggers:** lecture summary, exam prep, practice problems, concept explainers

**Outputs:**

- inline study view (summary, key points, Q&A, optional practice set)
- export as docx or structured study pack

**Evidence:** doc-first when user references their notes/files; web-first for general subjects; hybrid for “compare my notes to official syllabus.”

**Reuses:** `lectureNotes`, `practiceSet`, `examAnalysis` in `structured.ts`, math verification where applicable.

### 5.4 Inline answer (fallback)

Short factual or explanatory questions that do not warrant a full artifact still use the same evidence pipeline but render **compact chat answers** with citations — preserving the unified-RAG output contract.

---

## 6. User Experience

### 6.1 Single input

User does not choose:

- web vs library vs hybrid
- Standard vs Agentic
- tool from sidebar vs chat

The router resolves these. Power users may later override via explicit flags; not in MVP.

### 6.2 Progressive disclosure

1. **Acknowledgment** — what skill was selected and evidence route (subtle, not jargon-heavy)
2. **Preview** — summary + main content + split sources
3. **Actions** — Download docx/pptx, open in editor panel, regenerate section (paid)

### 6.3 Trial vs full (free vs paid)

| Capability | Free (trial) | Paid |
|------------|--------------|------|
| Standard Generate | Yes, capped | Yes, full budgets |
| Agentic Generate | No | Yes |
| Web retrieval depth | Low | High |
| Hybrid retrieval | Limited / disabled | Full |
| Citations shown | Few | Many |
| File export | Watermarked or preview-only | Full export |
| Monthly generation quota | Low | Plan-based |

Exact numbers live in the design spec budget tables and align with `src/lib/plans.ts` over time.

---

## 7. System Architecture (Approach 3)

```
User request
    │
    ▼
┌─────────────────────┐
│ L0: Intent router   │  → skill: report | presentation | study | inline
│     Source router   │  → route: web_first | doc_first | hybrid
│     Mode selector   │  → standard | agentic (if paid + complexity)
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌─────────┐ ┌──────────────┐
│ L1      │ │ L2           │
│ Standard│ │ Agentic      │
│ Generate│ │ Generate     │
└────┬────┘ └──────┬───────┘
     │             │
     └──────┬──────┘
            ▼
   Evidence bundle (web + library + notes)
            ▼
   Skill composer (report / ppt / study / inline)
            ▼
   Preview + optional file artifact + citations
```

### L0 — Intent & source router

Predicts:

- **generation skill** and output type (markdown, structured, docx, pptx)
- **evidence route** (`web_first`, `doc_first`, `hybrid`)
- **complexity** → Standard vs Agentic
- **answer format** for inline cases (`compact_fact`, `explanatory`, `comparison`, `study_helper`)
- **retrieval budget** from plan tier

Integrates with `intentTools.ts` patterns but extends beyond tool-id detection to full generative routing.

### L1 — Standard Generate

1. retrieve evidence per route (reuse `ragSearch`, `ragWeb`, `ragHybrid`, library index)
2. normalize and rerank (`ragRerank`, `ragMultiQuery`)
3. single-pass compose via skill-specific prompt + schema
4. validate structure (`structured.ts` parsers, `pptValidate`)
5. render preview + optional file

**Latency target:** suitable for interactive chat (tens of seconds, not minutes).

### L2 — Agentic Generate

For complex requests (long reports, multi-section decks, deep study packs):

1. **Plan** — outline sections / slides / study modules
2. **Retrieve per section** — iterative web/doc queries
3. **Draft** — section-by-section generation with evidence binding
4. **Review** — coverage check, citation gaps, consistency pass
5. **Assemble** — merge into final preview + file

Escalation rules: paid only; complexity heuristics (length, multi-topic, explicit “comprehensive/detailed”).

---

## 8. Evidence & Citations

All skills share one evidence model:

| Field | Description |
|-------|-------------|
| `sourceType` | `web` \| `library` \| `note` |
| `title` | Display title |
| `url` | Public URL or internal library id |
| `snippet` | Supporting excerpt |
| `score` | Rerank score |

UI groups citations:

- **Web**
- **Your materials**

Inline answers and file outputs must remain **grounded**: claims tied to evidence where feasible; uncited sections flagged in agentic review.

---

## 9. Relationship to Existing Codebase

| Existing module | Role in generative RAG |
|-----------------|------------------------|
| `src/lib/rag*.ts` | Evidence retrieval substrate |
| `src/lib/tools.ts` | Skill definitions and prompts |
| `src/lib/toolGeneration.ts` | File generation pipeline |
| `src/lib/structured.ts` | Parsed output schemas |
| `src/lib/docx.ts`, `pptx.ts` | Artifact builders |
| `src/lib/intentTools.ts` | Initial intent signals |
| `ChatWorkspace` / chat API | Primary UX shell |

**Principle:** extend and orchestrate — do not fork a parallel product.

---

## 10. MVP Phasing

### Phase 1 — Standard Generate core

- L0 router (skill + source route)
- L1 Standard Generate for **report** and **study** skills
- Split citations in chat preview
- Reuse existing structured parsers

### Phase 2 — Presentations + files + monetization

- Presentation skill via outline → fill → pptx
- docx/pptx export from generative RAG path
- Free vs paid retrieval and generation budgets wired to plan tier
- Trial UX (preview limits, export gates)

### Phase 3 — Agentic Generate

- L2 planner + iterative retrieval
- Auto-escalation from Standard when complexity + paid
- Self-review (coverage, citation completeness)
- Quality eval set for generative outputs

---

## 11. Out of Scope (MVP)

- Enterprise connectors (SharePoint, Google Drive sync)
- Org-wide knowledge graph
- Multimodal video/audio RAG beyond existing tool inputs
- User-visible manual router overrides
- Real-time collaborative editing of generated files

---

## 12. Key Risks

| Risk | Mitigation |
|------|------------|
| Router misclassifies skill or source | Log decisions; gold eval set per skill |
| Agentic latency/cost | Paid-only; budget caps; section limits |
| Ungrounded generation | Require evidence bundle; citation binding in composer |
| Tool vs chat duplication | Single orchestrator; tools become skill templates |
| Free abuse | Strict quotas, rate limits, no agentic |
| File quality regression | Reuse `pptValidate`, structured parsers, existing eval harness |

---

## 13. Acceptance Criteria

### Phase 1

- [ ] User asks for a report or study help without picking a tool; system selects skill automatically.
- [ ] Evidence route auto-selects web / doc / hybrid appropriately on a gold question set.
- [ ] Chat shows summary, body, and split citations.
- [ ] Structured report/study output parses through existing `structured.ts` validators.

### Phase 2

- [ ] Presentation requests produce outline preview and downloadable pptx on paid plans.
- [ ] Free users experience trial limits; paid users get full export and budgets.
- [ ] docx export works for report skill.

### Phase 3

- [ ] Complex paid requests escalate to Agentic Generate with multi-step retrieval.
- [ ] Agentic outputs pass coverage/citation review checks on eval set.

---

## 14. Execution Follow-up

Approved next artifacts:

- Design spec: `docs/superpowers/specs/2026-07-28-generative-rag-design.md`
- Implementation plan (after spec approval): `docs/superpowers/plans/2026-07-28-generative-rag.md`
- Supersede retrieval-only plan: `docs/superpowers/plans/2026-07-28-unified-rag.md`

---

## 15. Document History

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-07-28 | Approach 3 — Layered Generative RAG Platform; supersedes unified retrieval PRD |
