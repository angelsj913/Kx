# PRD: Kx( ZEFF AI ) 홈페이지·워크스페이스 UX 전면 개편

| Field | Value |
|-------|--------|
| **Status** | v2 — improve skill audit complete, executable plans ready |
| **Author** | Advisor (shadcn/improve) + Product |
| **Date** | 2026-07-27 |
| **Planned at** | commit `9d8b25f` |
| **Executable plans** | [`plans/README.md`](../plans/README.md) (15 handoff plans) |
| **Advisor skill** | `shadcn/improve@improve` → `.agents/skills/improve/` |

---

## How to use this document

This PRD is the **strategic overview**. Implementation details live in **`plans/001`–`plans/015`**, written per the improve skill handoff template — each plan is self-contained for an executor with zero prior context.

**Do not start coding from this file alone.** Open `plans/README.md`, pick the next `TODO` row, read that plan end-to-end, then execute.

---

## 0. 사용자 의도 (confirmed)

Kx( ZEFF AI )의 **첫인상(홈)** 과 **핵심 경험(워크스pace)** 을 AI-template SaaS에서 **사람이 만든 제품**처럼 바꾸고, 동시에 **버그·RAG·법률·검열·문서 생성** 품질을 프로덕션 수준으로 끌어올린다.

| 축 | 요청 |
|----|------|
| 디자인 | nothing-design + frontend-design 홈 개편 |
| 콘텐츠 | humanizer/copy-editing 톤 (회사 페이지·랜딩·워크스페이스) |
| UX | 푸터·뒤로가기·햄버거 색·다운로드 숨김(코드 유지) |
| 워크스페이스 | 채팅바·로딩·로고 아바타·아이콘 액션·품질 tier |
| RAG | threshold + 웹 검색 fallback |
| PPT/문서 | RAG 연동·테마·애니메이션 |
| 검열 | 입력 moderation PRD → plan 012 |
| 법률 | deep-research → plan 013 |
| 제외 | 이미지 생성 — plan 015 **승인 전 BLOCKED** |
| 선행 | 커밋 `06c604a` 스킬 팩 롤백 — plan 001 |

---

## 1. improve skill audit — vetted findings

Evidence verified at `9d8b25f`. Full table: [`plans/README.md`](../plans/README.md).

| ID | Finding | Plan |
|----|---------|------|
| F-01 | PPT intent on meta questions | 009 |
| F-02 | RAG threshold too low (0.15) | 010 |
| F-03 | No web search fallback | 010 |
| F-04 | Back button uses history | 002 |
| F-05 | Header ≠ menu background | 003 |
| F-06 | Footer layout | 002 |
| F-07 | Admin not in hamburger | 007 |
| F-08 | Loading status misplaced | 008 |
| F-09 | Sparkles not Logo avatar | 008 |
| F-10 | Verbose action buttons | 008 |
| F-11 | Stale agent placeholder | 009 |
| F-12 | Duplicate scroll sections | 004 |
| F-13 | Legal placeholders | 013 |
| F-14 | No moderation | 012 |
| F-15 | Bulk skills commit | 001 |
| F-16 | Image-gen drift | 015 (blocked) |

---

## 2. Execution roadmap

```
001 revert skills
002 footer + back nav     003 header + download hide
006 copy humanize         007 admin discovery
008 chat UX polish        009 intent + quality tier
010 RAG + web search
004 scroll sections ──► 005 nothing-design pass
011 PPT RAG + animations (after 010)
012 moderation            013 legal research
014 context dock (optional P3)
015 image gen (BLOCKED)
```

**Parallel tracks:** 006 ‖ 007 ‖ 008; 013 ‖ 004; 012 after 009.

---

## 3. Design direction (nothing-design summary)

- **Subject:** AI workspace — “잡음 속 핵심 (Zeff)”
- **Fonts:** Space Grotesk + Space Mono + Doto (hero only)
- **Palette:** warm off-white / OLED black; accent `#D71921` once per screen
- **Anti-patterns:** gradient chrome, skeleton loaders, toast popups, generic blue SaaS hero
- **Wireframe:** see plan 005 + appendix in v1 PRD git history

---

## 4. Workspace panel ideas (product record)

1. **Context Dock** — plan 014 (MVP)
2. **Output Timeline** — plan 016
3. **Plan + Execute split** — plan 016

---

## 5. RAG improvements (advisor recommendation)

| # | Approach | Priority |
|---|----------|----------|
| 1 | Relevance threshold ≥ 0.35 | P0 — plan 010 |
| 2 | LLM rerank top-20 → top-3 | P1 — plan 017 |
| 3 | Web search fallback | P0 — plan 010 |

---

## 6. PPT/Excel/Word quality (beyond RAG)

1. RAG-informed outline + footnotes — plan 011
2. Optional user outline confirmation — future
3. Domain template library `data/templates/ppt/*.json` — future

---

## 7. AI moderation summary (plan 012)

Pre-filter categories: sexual explicit, CSAM, credential/source exfil, cross-user PII, violence how-to (not legal education), jailbreak. Server-side in `/api/chat`; policy messages i18n; security event log for admin.

Detail: [`plans/012-ai-input-moderation.md`](../plans/012-ai-input-moderation.md)

---

## 8. Verification baseline

| Command | Expected |
|---------|----------|
| `npm run lint` | exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `npm run build` | exit 0 (env permitting) |

---

## 9. Open questions

1. Business registration fields for legalContent — owner input required (plan 013 STOP)
2. Web search provider API key — confirm env (plan 010)
3. Download menu in hamburger — hide with hero? (plan 003 optional)
4. Image generation — explicit approval to unblock plan 015

---

## 10. Changelog

| Version | Date | Change |
|---------|------|--------|
| v1 | 2026-07-27 | Initial draft PRD |
| v2 | 2026-07-27 | Rebuilt with shadcn/improve audit → `plans/` handoffs |
