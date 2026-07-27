# Full-repo Review Findings — Kx (main codebase)

**Date:** 2026-07-27  
**Scope:** Entire `/workspace/src` production runtime (NOT PR-diff-only)  
**Branch pushed first:** `cursor/kx-ux-overhaul-prd-a14a` @ `7fe80e9`  
**Skills:** `/review-security`, `/review-bugbot`, `/requesting-code-review`, `/receiving-code-review`, ponytail-adult (repo-history criteria; skill pack not installed)

## Executive summary

Prior turn only audited the UX-overhaul PR diff. This pass covers **all 355 TS/TSX source files**. Highest risks: OTP completion race (ATO), admin MFA not covering APIs, agent/regenerate moderation gaps.

---

## Security (full repo)

| Severity | Location | Finding | Action |
|----------|----------|---------|--------|
| Critical | `otp.ts` + reset/signup | `hasRecentVerifiedOtp` 30m window reusable by anyone after victim verifies | **FIX** — single-use consume |
| High/Med | `adminMfa.ts` + `requireAdmin.ts` | MFA cookie `path:/admin` never sent to `/api/admin/**`; APIs skip MFA; `"dev-admin-mfa"` fallback | **FIX** |
| Medium | Blob `access:public` chat/library | URL = read access | DEFER (large storage migration) |
| Medium | `itemAccessWhere` | Removed members keep uploader access | DEFER (tenancy redesign) |
| Medium | `auth.ts` jwt | sessionVersion fail-open | DEFER (availability tradeoff; note only) |

## Bugbot (full repo)

| Severity | Location | Finding | Action |
|----------|----------|---------|--------|
| high | `agentTools.ts` zeff_tool | Agent instruction bypasses `moderateInput` | **FIX** |
| high | `chat/route.ts` regenerate | `regenerate` skips moderation on stored text | **FIX** |

## Code review (full repo)

| Severity | Location | Finding | Action |
|----------|----------|---------|--------|
| Important | `ChatWorkspace.tsx` | Uncaught `JSON.parse(resultData)` crashes chat | **FIX** |
| Important | `account/password` | bcrypt cost 10 vs `BCRYPT_COST` 12 | **FIX** |
| Important | review/rag quota | Unmetered AI spend | DEFER |
| Important | library finalize | Blob URL ownership | DEFER |
| Important | pingback downgrade | Blind `plan:free` | DEFER |

## Ponytail (dead code, 0 callers verified)

| Action | Target |
|--------|--------|
| delete | `LibraryView.tsx`, `AdminAccessDenied.tsx`, `prompts/index.ts` |
| delete exports | `buildZeffRuntimeInstruction`, `getOpenRouterVisionModels`, `securityAgentToolSchemas`, `sceneIndex`, `downloadMarkdown`, `imagePromptPassesGolden`, `agentModelsForTier`, `DEEPSEEK_MODELS`, `IMAGE_GEN_COST_ORDER`, `MULTIMODAL_MODELS`, `getActiveWorkspaceId`, `getProviderSkipReason`, unused constants |

---

## This turn implemented

- OTP: `consumeRecentVerifiedOtp` single-use (signup/reset)
- Admin MFA: cookie `path:/`, API MFA gate, timing-safe compare, no prod secret fallback; MFA send/verify `skipMfa`
- Agent `zeff_tool` + regenerate: `moderateInput`
- ChatWorkspace: safe `JSON.parse` for pptx/xlsx/structured
- account password: `BCRYPT_COST`
- Ponytail cuts: LibraryView, AdminAccessDenied, prompts barrel, dead exports/constants

## Follow-up implemented (deferred → done)

| Item | Status |
|------|--------|
| Quota + rate limit `/api/review/generate` | DONE (chat quota + 20/hr) |
| Quota + rate limit `/api/rag/index` | DONE (chat quota + 30/hr) |
| Library blob finalize ownership | DONE (`library/${userId}/` on token + finalize) |
| Paymentwall blind downgrade | DONE (grantedPlan + matching paid order) |
| Workspace kick access revoke | DONE (`itemAccessWhere` / `listWhere` membership for team rows) |
| Public Blob → private | **STOP** — signed-URL UX across chat/library/citations; dedicated PR |
| sessionVersion fail-open | still deferred (availability tradeoff) |
