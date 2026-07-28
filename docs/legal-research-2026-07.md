# Legal research notes — ZEFF AI (2026-07)

> Internal reference for Plan 013. Not user-facing marketing. Recommend human legal review before launch in new jurisdictions.

## Research scope

Grounded in codebase facts and common SaaS compliance patterns (PIPA, e-commerce act, AI disclaimers, international users).

### ZEFF AI operational facts (verified in repo)

| Area | Fact |
|------|------|
| Auth | Google OAuth + email/password (NextAuth, `src/auth.ts`) |
| Hosting | Vercel (`vercel.json`, Blob storage) |
| Database | Neon PostgreSQL (Prisma) |
| Email | Resend (OTP, notifications) |
| Payments | Paymentwall (`src/lib/paymentwall.ts`, pingback route) |
| AI inference | Multi-provider routing: Gemini, Groq, Cerebras, Mistral, DeepSeek, SambaNova, OpenRouter (`src/lib/models.ts`) |
| Contact | zeff@zeffai.com |
| CEO | 권승준 (Kwon Seungjun) |
| Business no. | 435-42-01296 |
| Account deletion | Request via email / 1:1 inquiry (no self-service delete UI yet) |
| EU/EEA/UK paid | Not offered (documented in INTERNATIONAL) |

## Gap analysis checklist

| Requirement | Status | Action taken |
|-------------|--------|--------------|
| PIPA — collection purpose, retention, rights | Partial → Updated | Expanded OAuth, subprocessors, deletion via request |
| E-commerce act — refund, subscription cancel | OK | Existing t10–t12 retained |
| AI disclaimer — not legal/medical advice | OK | t14 retained |
| Minors — 19+ gate | OK | t6 + age box on legal page |
| Subprocessors table | Gap → Fixed | Vercel, Neon, Resend, Google, Paymentwall, AI providers in p13 |
| Placeholder business address / mail-order no. | Missing owner data | Replaced with "별도 고지 예정" + contact email |
| Account deletion accuracy | Overclaimed | Changed to email/inquiry request path |
| GDPR (EU users) | Out of scope for paid | Free tier disclaimer in INTERNATIONAL i2 |
| Japan specified commercial transactions | Phone TBD | phone field → 별도 고지 예정 |

## Owner fields still required

Before public launch or Japan paid sales, obtain and update `COMPANY_INFO`:

1. **Business address** (사업자 소재지)
2. **Mail-order registration number** (통신판매업 신고번호)
3. **Phone number** (Japan 特定商取引法 — if selling paid in Japan)

Update `src/lib/legalContent.ts` `COMPANY_INFO` when values are confirmed.

## Comparison notes (SaaS benchmarks)

- **Terms**: Service definition, AI limitation, auto-renewal disclosure (US), governing law KR — aligned with Linear/Vercel-style SaaS terms structure.
- **Privacy**: OAuth scope disclosure, international transfer list, processor names — aligned with PIPA + common subprocessor appendix pattern.
- **Consent**: Separate consent document for signup — matches domestic signup flow expectations.

## Verification

```bash
rg '\[.*\]' src/lib/legalContent.ts   # should only match TypeScript array exports, not placeholder strings
```

Legal page anchors: `/support/legal#terms`, `#international`, `#privacy`, `#consent`
