# Plan 014: Workspace right panel — Context Dock MVP

> **Drift check**: `git diff --stat 9d8b25f..HEAD -- src/components/ChatRightPanel.tsx src/components/ChatWorkspace.tsx`

## Status

- **Priority**: P3 | **Effort**: M | **Risk**: LOW | **Depends on**: 008 | **Planned at**: `9d8b25f` | **Done**: 2026-07-27

## Why this matters

User asked for 3 workspace panel ideas; this plan implements **#1 Context Dock** as MVP.

## Idea summary (all 3 — for product record)

| # | Idea | This plan |
|---|------|-----------|
| 1 | **Context Dock** — attached library docs as chips + preview | **MVP here** |
| 2 | Output Timeline — files tab chronological + “continue editing” | Future |
| 3 | Plan + Execute split — agent plan tab sync with terminal | Future |

## Current state

- `ChatRightPanel.tsx` — tabs: files, plan, terminal
- RAG chunks not surfaced as persistent chips during chat
- Library attachments exist in composer but not in panel

## Scope

**In scope:**
- New section at top of right panel (or new “context” tab): chips for active library items / last RAG sources
- Click chip → expand snippet or open library item
- State from ChatWorkspace: `attachedLibraryIds`, last `CitationCards` sources

**Out of scope:**
- Output Timeline full redesign
- Terminal tab changes

## Steps

### Step 1: State lift

Pass `contextSources: {id, title, snippet}[]` from ChatWorkspace to ChatRightPanel.

### Step 2: UI chips

Nothing-style mono labels, compact row, max 5 visible + “+N”.

### Step 3: i18n

`panel.context.title`, `panel.context.empty`

**Verify**: `npm run lint` → exit 0

## Done criteria

- [x] After RAG answer, sources appear as chips in right panel
- [x] Empty state when no context attached

## STOP conditions

- Panel width breaks mobile layout — collapse to drawer on sm
