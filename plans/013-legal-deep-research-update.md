# Plan 013: Legal pages via deep-research

> **Drift check**: `git diff --stat 9d8b25f..HEAD -- src/lib/legalContent.ts src/app/support/legal/`

## Status

- **Priority**: P1 | **Effort**: L | **Risk**: MED | **Planned at**: `9d8b25f` | **Completed**

## Why this matters

`legalContent.ts` contains placeholders (`[사업자 소재지]`, etc.) and may not reflect actual ZEFF AI operations (OAuth, Vercel, Neon, Blob, Paymentwall, multi-locale).

## deep-research workflow

1. Install/use skill: `.agents/skills/deep-research/` (requires `GEMINI_API_KEY`)
2. Research queries (examples):
   - “Korean SaaS terms of service AI chatbot OAuth 2025 requirements”
   - “PIPA privacy policy cloud hosting Vercel Neon template”
   - “International users GDPR APPI disclosure SaaS Korea”
3. Compare: Notion, Linear, Vercel, domestic SaaS terms
4. Draft updated `TERMS`, `PRIVACY`, `INTERNATIONAL`, `CONSENT` arrays in `legalContent.ts`

## ZEFF AI facts to ground (from codebase)

- Google OAuth login (`auth.ts`)
- Cloud DB + Blob storage (Prisma, PROGRESS.md)
- AI outputs not legal advice disclaimer
- Account deletion → data deletion claim must match actual API
- Contact: zeff@zeffai.com
- CEO: 권승준 / Kwon Seungjun

## Scope

**In scope:**
- `src/lib/legalContent.ts` — full article rewrite
- Remove or replace placeholders with real values **when provided by owner**; otherwise use “별도 고지 예정” minimal compliant wording
- `landingI18n` section titles unchanged unless needed
- Footer links still `#terms`, `#privacy`

**Out of scope:**
- Lawyer review sign-off (recommend human review note in page)
- Non-Korean legal body (UI i18n only for chrome)

## Steps

### Step 1: Research run

Execute deep-research script; save output to `docs/legal-research-2026-07.md` (internal, not user-facing marketing)

### Step 2: Gap analysis

Checklist against PIPA, e-commerce act, AI service disclaimers, minors, subprocessors table.

### Step 3: Update legalContent.ts

Implement articles; no `[placeholder]` strings remain.

### Step 4: Verify links

`/support/legal#terms`, `#privacy`, `#international`, `#consent` render.

**Verify**: `rg "\\[" src/lib/legalContent.ts` → no bracket placeholders

## Done criteria

- [x] Terms include: service definition, AI disclaimer, payment/refund, termination, governing law
- [x] Privacy includes: OAuth data, subprocessors, retention, user rights, contact
- [x] Placeholders eliminated or replaced with owner-approved values

## STOP conditions

- Owner must supply business registration address / mail-order number — stop and list required fields

## Maintenance notes

Any new payment provider or region launch triggers legal review per this doc
