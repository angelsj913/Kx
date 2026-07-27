# Disambiguate Ambiguous Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove dual/ambiguous APIs and dead exports so each concern has one clear entry point.

**Architecture:** Surgical deletions and renames only. Keep existing behavior for live call sites (`buildZeffRuntimeContext`, `sendMail`, user-scoped workspace keys).

**Tech Stack:** Next.js TypeScript app (`src/`).

---

### Task 1: Runtime context — single entry

**Files:**
- Modify: `src/lib/zeffContext.ts`
- Modify: `src/app/api/chat/route.ts`

- [ ] Remove `buildZeffRuntimeInstruction` and `assembleRuntimeContext`
- [ ] Point chat route imports/calls at `buildZeffRuntimeContext`
- [ ] Commit

### Task 2: Mail — single entry

**Files:**
- Modify: `src/lib/mail.ts`
- Modify: `src/lib/email.ts`

- [ ] Remove `sendEmail`; update `email.ts` to `sendMail` with equivalent throw behavior
- [ ] Commit

### Task 3: Delete dead UI + unused exports

**Files:**
- Delete: `src/components/LibraryView.tsx`, `src/components/admin/AdminAccessDenied.tsx`, `src/lib/prompts/index.ts`
- Modify: `src/lib/openaiCompat.ts`, `src/lib/textExport.ts`, `src/lib/landingScroll.ts`, `src/lib/rag.ts`, `src/lib/workspaceClient.tsx`, `src/lib/constants.ts`, `src/lib/security/agentTools.ts`, `src/lib/providerHealth.ts`, `src/lib/backendRoute.ts`

- [ ] Remove listed dead/deprecated symbols
- [ ] Clarify workspace storage key constants
- [ ] Drop `AI_SKIP_VERIFY` check
- [ ] Typecheck
- [ ] Commit
