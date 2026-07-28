# Plan 016: Output Timeline + Plan/Execute panel

> **Drift check**: `git diff --stat HEAD -- src/components/ChatRightPanel.tsx src/components/ChatWorkspace.tsx`

## Status

- **Priority**: P3 | **Effort**: M | **Risk**: LOW | **Depends on**: 014 | **Planned at**: `1fc8b34` | **Done**: 2026-07-28

## Why this matters

Plan 014 shipped Context Dock only. PRD §4 remaining ideas:

| # | Idea | This plan |
|---|------|-----------|
| 2 | **Output Timeline** — files chronological + continue editing | **MVP** |
| 3 | **Plan + Execute** — plan tab synced with agent/route stages | **MVP** |

## Scope

**In scope:**
- Files tab as vertical timeline (newest first) with “continue editing” for editable outputs
- Plan tab: step list derived from stream status events; terminal remains execute log (admin)
- i18n for continue-editing / plan status labels

**Out of scope:**
- Persisting plans to DB
- Reordering / user-editable plan checklists

## Done criteria

- [x] Files tab shows timeline rail + continue-editing CTA
- [x] Plan tab updates while a chat turn runs
- [x] `npm run lint` / `npx tsc --noEmit` / `npm run eval:ai` pass
