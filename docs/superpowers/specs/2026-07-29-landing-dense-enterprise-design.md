# Landing Dense Enterprise Redesign

**Date:** 2026-07-29  
**Branch:** `cursor/landing-dense-enterprise-a14a`

## Goal

Homepage feels like a polished enterprise marketing site (Notion/Stripe density): less empty scroll runway, more visible content and product detail per viewport. Keep ZEFF blue tokens and existing i18n copy.

## Decisions

- Approach: refactor existing sections (no full component rewrite set)
- Remove sticky `360/320/420vh` tracks; use static grids / splits
- Hero: tighter first viewport — brand + headline + subtitle + CTA + product preview (video remains full-bleed background)
- Visual: Notion/Stripe density + existing `--landing-*` blue tokens (no purple/cream/broadsheet theme)
- Scope: Hero + below-fold sections; pricing logic unchanged
- CTAs: `/app` where practical (proxy-protected)

## Section map

1. Header — keep
2. Hero — dense first viewport + product chrome preview
3. Skills — 3-column feature grid + CTA band
4. Features — compact strip + alternating split rows (docs / library)
5. Office + Lecture — 3-column use-case grid with always-visible mocks
6. WorkspaceIntro — tighter padding, 3 pillars
7. PricingLead + Pricing — tighter spacing
8. Footer — keep

## Non-goals

- New brand colors / fonts
- Sticky scroll storytelling
- Payment flow changes
- Merging unfinished P2 SessionProvider work (optional follow-up)

## Success

- No multi-hundred-vh sticky sections on `/`
- First viewport filled without large empty bands
- Sticky animations replaced by light `whileInView` / CSS only
- Mobile readable; reduced-motion gets same static layouts
