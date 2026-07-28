# Plan 008: Chat composer UX — loading, logo avatar, icon-only actions

> **Drift check**: `git diff --stat 9d8b25f..HEAD -- src/components/ChatWorkspace.tsx src/components/CopyButton.tsx src/components/ui/Logo.tsx`

## Status

- **Priority**: P1 | **Effort**: M | **Risk**: LOW | **Planned at**: `9d8b25f`

## Why this matters

Loading status appears above textarea (`ChatWorkspace.tsx:1077-1089`) while spinner logo is in message area (`1060-1063`). User wants status beside spinning logo. Model messages use Sparkles avatar; user wants theme-aware Logo. Action buttons show long Korean labels.

## Current state

**Loading block:**
```tsx
{loading && !streamingId && (
  <div className="flex h-10 items-center">
    <Logo size="sm" withWordmark={false} spin />
  </div>
)}
```

**Status above form:**
```tsx
{statusKey && (
  <motion.span className="text-[11px] ...">
    {t(statusKey)}
  </motion.span>
)}
```

**Model avatar:** `Sparkles` in gradient circle (`873-874`)

**Logo component** (`Logo.tsx`) — already supports dark/light images

## Scope

**In scope:**
- Merge loading UI: `flex items-center gap-2` with Logo spin + status text inline
- Remove status row above textarea (or only show non-loading statuses there if needed)
- Replace Sparkles avatar with `<Logo size="sm" withWordmark={false} />`
- `CopyButton`, regenerate, feedback, download — icon only, keep `aria-label={t(...)}`

**Out of scope:**
- ChatComposer full refactor (optional follow-up)
- User message OAuth avatar

## Steps

### Step 1: Inline loading status

```tsx
{loading && !streamingId && (
  <div className="flex items-center gap-2.5">
    <Logo size="sm" withWordmark={false} spin />
    {statusKey && (
      <span className="text-xs text-blue-600 dark:text-blue-300">
        {t(statusKey)}
      </span>
    )}
  </div>
)}
```

Remove duplicate status from form header when `loading && !streamingId`.

### Step 2: Model avatar → Logo

Replace Sparkles div with Logo (same size h-7 w-7 container).

### Step 3: Icon-only actions

Update `CopyButton` to accept `iconOnly?: boolean` default true in chat context.
Hide text spans on feedback buttons; use `title` attribute.

**Verify**: `npm run lint` → exit 0

## Done criteria

- [x] “모델 시도 중…” appears next to spinning logo, not above + menu
- [x] Model messages show Logo not Sparkles
- [x] Action row has no visible “복사/재생성/좋아요” text (aria-label present)

## STOP conditions

- Logo spin breaks SSR — ensure client-only guard if needed
