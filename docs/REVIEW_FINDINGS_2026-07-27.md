# Review / Debug Findings Log — Kx PR #57

**Date:** 2026-07-27  
**Branch:** `cursor/kx-ux-overhaul-prd-a14a`  
**Head:** `5fa4d7b` → (post-fix)  
**Skills used:** `/review-security`, `/review-bugbot`, `/requesting-code-review`, `/receiving-code-review`, ponytail-adult (dead-code/over-engineering audit; skill pack not installed — applied prior ponytail audit criteria from repo history)

## Skill results (raw severity)

| Source | Severity | Finding | Verdict |
|--------|----------|---------|---------|
| security + bugbot + code-review | Critical/High | `effectiveModelTier` promotes free→`top` on High | **FIX** — cap at plan tier |
| security | Medium | Attachment-only skips moderation | **FIX** — moderate filenames when text empty |
| bugbot + code-review | Medium | Moderation after `chatHistory` + memory learn | **FIX** — gate before persist/learn |
| bugbot + code-review | Medium | `maxOutputTokens` never applied | **FIX** — wire through chat generate path |
| code-review | Important | `shouldUseWebSearch` always true on weak RAG | **FIX** — require legal/factual/current-events intent |
| bugbot | Medium | Context Dock `sources.find()!` crash | **FIX** — null-safe expand |
| bugbot | Medium | Agent path omits citation `resultData` | **FIX** — persist `agentContext.citations` |
| ponytail | Dead code | `defineSlideMaster(ZEFF_MASTER)` never used | **FIX** — remove |
| ponytail + code-review | Typo | `전동\s*드rill` in imagePrompt | **FIX** |
| code-review | Minor | Jailbreak hard-block vs plan strip | Keep (stricter; intentional) |
| code-review | Minor | Golden harness skips `{cases:[]}` shape | **DEFER** — harness change separate |
| code-review | Minor | Context Dock missing attachedLibraryIds | **DEFER** — plan MVP citations-only OK |

## Actions this turn

1. Cap `effectiveModelTier` so quality never exceeds plan `modelTier` — **DONE**
2. Narrow `shouldUseWebSearch` — **DONE** (weak RAG ∧ legal/factual/current-events)
3. Null-safe Context Dock snippet — **DONE**
4. Moderation before user persist + attachment filename probe — **DONE**
5. Wire `maxOutputTokens` into generate path (gemini + openai-compat) — **DONE**
6. Remove unused PPT slide master — **DONE**
7. Fix imagePrompt typo — **DONE**
8. Agent citation `resultData` on agent route — **DONE**
9. Re-lint / tsc / push PR — **DONE**

## Deferred (not wrong, out of minimal-fix scope)

- Eval harness wrapper support for moderation/image-prompt goldens
- Composer attached-library chips in Context Dock
