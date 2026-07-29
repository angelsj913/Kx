# Performance Wave B P1 — Implementation Plan

> Spec: `docs/PRD_SCAN_LICENSE_PERF_2026-07.md` §5 Wave B P1

**Goal:** Shrink initial `/app` JS by lazy-loading non-default locales and heavy chat panels.

### Done

1. **i18n split** — `src/lib/i18nKeys.ts` (KO + keys), `src/lib/i18n/en.ts` eager; `ja/zh/ru/de/fr/es/ar` dynamic `import()` on language change.
2. **ChatWorkspace** — `FileResultPanel`, `StructuredResultView`, `ChatRightPanel`, `KnowledgeBaseSheet`, `GenerativeResultPanel` via `next/dynamic` (parsers stay static).
3. **ProfileMenu** — `SettingsModal` dynamic + mount only when open.

### Verify

- Build passes
- Default ko/en UI instantly translated
- Switching to ja/de loads chunk then updates strings
- Opening settings / knowledge base / right panel loads on demand
