# Landing design skills (local install)

Bulk packs (`awesome-codex-skills`, `remotion-dev/remotion`) add 200+ skills — **not committed** to keep the repo lean (see `plans/001-revert-external-skills-commit.md`).

## Curated skills (in repo)

| Skill | Install |
|-------|---------|
| design-motion-principles | `npx skills add kylezantos/design-motion-principles -y` |
| animate | `npx skills add delphi-ai/animate-skill --skill animate -y` |
| guardrail-design | `npx skills add Owl-Listener/ai-design-skills --skill guardrail-design -y` |
| trust-calibration | `npx skills add Owl-Listener/ai-design-skills --skill trust-calibration -y` |
| animation-principles | from `Owl-Listener/designer-skills` |
| color-system | from `Owl-Listener/designer-skills` |

## Optional local reference (do not commit)

```bash
npx skills add ComposioHQ/awesome-codex-skills -y
npx skills add remotion-dev/remotion -y
npx skills add devonjones/devon-claude-skills -y
npx skills add LobzyJay/motion-design-with-claude -y
```

## Playwright MCP (Cursor desktop)

```bash
claude mcp add playwright -s user -- npx @playwright/mcp@latest
```

Cloud agents: configure Playwright MCP in Cursor IDE settings if E2E browser tests are needed.
