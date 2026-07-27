# Plan 001: Revert commit 06c604a (external skill packs)

> **Executor instructions**: Follow step by step. Honor STOP conditions. Update status in `plans/README.md` when done.
>
> **Drift check**: `git diff --stat 9d8b25f..HEAD -- .agents/ skills-lock.json .cursor/skills agent/ data/skills .claude/`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `9d8b25f`, 2026-07-27

## Why this matters

Commit `06c604a076bff44553a1f9cba02681a52a7f1bd4` added ~112 agent skills (`.agents/skills/`, symlinks) totaling thousands of files. This bloats the repo and is unrelated to ZEFF AI runtime. The product owner requested removal before UX work. Keep **`shadcn/improve`** skill only (installed separately for planning).

## Current state

- Bulk install from PR #56: `.agents/skills/*` (112 skills), `skills-lock.json`, symlinks in `agent/skills/`, `data/skills/`, `.claude/skills/`
- **Keep**: `.agents/skills/improve/` (from `shadcn/improve@improve`), `.cursor/skills/improve` symlink
- App code under `src/` does not import `.agents/skills/`

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Revert | `git revert 06c604a076bff44553a1f9cba02681a52a7f1bd4 --no-edit` | clean revert or resolve conflicts |
| Lint | `npm run lint` | exit 0 |
| Typecheck | `npx tsc --noEmit` | exit 0 |

## Scope

**In scope:**
- Revert commit `06c604a` OR manually delete bulk skills and restore `skills-lock.json` to improve-only
- Re-add `.agents/skills/improve/` if revert removes it

**Out of scope:**
- Removing Cursor global skills on developer machines
- Changing `src/lib/skills/index.ts` (ZEFF soft skill packs — different system)

## Steps

### Step 1: Revert bulk commit

```bash
git revert 06c604a076bff44553a1f9cba02681a52a7f1bd4 --no-edit
```

If `06c604a` is not in history (already reverted), skip to step 2.

**Verify**: `ls .agents/skills 2>/dev/null | wc -l` → should not be ~112

### Step 2: Re-install improve skill only

```bash
npx skills add shadcn/improve --skill improve -y
mkdir -p .cursor/skills
ln -sfn ../../.agents/skills/improve .cursor/skills/improve
```

**Verify**: `test -f .agents/skills/improve/SKILL.md && echo OK`

### Step 3: Commit

Message: `revert: remove bulk external skill packs; keep improve advisor skill`

**Verify**: `npm run lint` → exit 0

## Done criteria

- [ ] No bulk skill directories from `06c604a` remain in repo
- [ ] `.agents/skills/improve/SKILL.md` exists
- [ ] `npm run lint` exits 0
- [ ] `plans/README.md` row 001 → DONE

## STOP conditions

- Revert conflicts with newer commits — stop and report diff summary
- `improve` skill fails security scan — stop and report

## Maintenance notes

Future skill installs: use project-local `npx skills add` one at a time; avoid `--all` on large repos unless explicitly requested.
