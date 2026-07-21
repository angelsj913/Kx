<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# System Rules

Always-applied project rules live in `.cursor/rules/` (`alwaysApply: true`):

- `react-typescript-ui.mdc` — React, TypeScript, shadcn/ui, Tailwind
- `production-discipline.mdc` — dependencies, errors, comments, state, fetching, webhooks, DB safety
- `nextjs-tailwind-seo.mdc` — Next.js App Router, Tailwind, SEO
- `pressThat-wordpress.mdc` — PressThat WordPress NUX / credentials flow

Follow those rules in every coding task. Do not leave stub/partial implementations when a complete feature was requested.
