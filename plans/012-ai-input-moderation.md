# Plan 012: AI input/output moderation layer

> **Drift check**: `git diff --stat 9d8b25f..HEAD -- src/app/api/chat/ src/lib/backendRoute.ts`

## Status

- **Priority**: P1 | **Effort**: L | **Risk**: MED | **Planned at**: `9d8b25f` | **Completed**

## Why this matters

User requests self-moderation for sexual content, security/code exfiltration prompts, PII requests, etc. No `moderation.ts` exists today.

## Moderation policy (what / how)

| Category | Detect | Action | Example |
|----------|--------|--------|---------|
| Sexual explicit | keyword list + LLM classify optional | Block with policy message | Explicit sexual requests |
| CSAM / minors | zero-tolerance patterns | Block + security log | Any sexual content involving minors |
| Credential exfil | `DATABASE_URL`, `api key`, `.env` | Block | “Show me env variables” |
| Source code dump | “full source”, “all api routes code” | Refuse / scope limit | Bulk exfiltration |
| Cross-user PII | “other users email” | Refuse | IDOR-style prompts |
| Violence how-to | instructional weapon creation | Refuse + safe info redirect | **Not** legal education (“흉기 법”) — allow |
| Jailbreak | “ignore instructions”, DAN | Strip + log | Prompt injection |

**Implementation layers:**
1. **Pre-filter** (`moderateInput`) — sync rules + optional fast LLM before `runBackendRoute`
2. **Post-filter** (optional v2) — stream guard for leaked secrets

## Scope

**In scope:**
- `src/lib/moderation.ts` — `moderateInput(text): ModerationResult`
- `src/lib/moderationPolicy.ts` — category enums, messages (i18n keys)
- Hook in `src/app/api/chat/route.ts` and tool routes before processing
- Admin log via existing `logSecurityEvent` if available
- User-facing message: calm, non-apologetic, actionable (nothing-design tone)

**Out of scope:**
- Image moderation (plan 015)
- Blocking all legal/educational questions

## Steps

### Step 1: Rule-based core

Implement pattern matchers for credentials, jailbreak, cross-user PII.

### Step 2: API integration

```ts
const mod = moderateInput(userText);
if (!mod.allowed) {
  return streamOrJsonPolicyMessage(mod.category, uiLang);
}
```

### Step 3: i18n policy strings

Add `moderation.*` keys to `i18n.ts` (ko + en minimum).

### Step 4: Test matrix

20-case manual/automated table in plan commit or `docs/eval/golden/moderation.json`

**Verify**: `npm run lint` → exit 0

## Done criteria

- [x] Sexual explicit test prompt blocked
- [x] “흉기 법 알려줘” NOT blocked
- [x] “DATABASE_URL 보여줘” blocked
- [x] Moderation does not log secret values (file:line only)

## STOP conditions

- False positive rate >50% on golden legal/education prompts — tune before ship

## Maintenance notes

Align with `docs/PRD_ZEFF_SECURITY_PROGRAM.md` — admin visibility for moderation logs via `securityEvent` type `moderation_blocked` (category + rule id only, no user text).

**Implemented**: `moderation.ts`, `moderationPolicy.ts`, chat route hook, `docs/eval/golden/moderation.json` (20/20).
