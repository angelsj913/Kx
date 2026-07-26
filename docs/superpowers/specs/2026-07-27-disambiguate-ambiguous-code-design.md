# Design: Disambiguate ambiguous Kx APIs

## Problem
Kx has dual entry points and unused exports that make the “real” path unclear (aliases, deprecated wrappers, dead components, silent env kill-switches).

## Goal
One canonical path per concern. Behavior unchanged for live callers. No feature work, no security redesign in this pass.

## In scope
1. Runtime context: keep `buildZeffRuntimeContext` only; drop alias + unused instruction helper.
2. Mail: keep `sendMail` only; fold `sendEmail` callers.
3. Delete unused UI: `LibraryView`, `AdminAccessDenied`.
4. Remove dead/deprecated exports (`getOpenRouterVisionModels`, `downloadMarkdown`, `sceneIndex`, `topK`, `getActiveWorkspaceId`, unused constants, unused `prompts/index.ts`, `securityAgentToolSchemas`, `getProviderSkipReason`).
5. Clarify workspace localStorage key naming (prefix vs legacy bare key).
6. Remove `AI_SKIP_VERIFY` bypass so verify policy is explicit in code.

## Out of scope
Dual i18n merge, dual SMTP+Resend consolidation, SESSION_ANALYSIS security fixes, framer-motion removal.

## Success
- `rg` shows single entry points for context/mail.
- `npx tsc --noEmit` (or project typecheck) passes.
- Chat/OTP/email call sites still compile against the kept APIs.
