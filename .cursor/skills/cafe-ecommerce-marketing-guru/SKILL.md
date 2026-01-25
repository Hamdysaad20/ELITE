---
name: cafe-ecommerce-marketing-guru
description: Guides ecommerce strategy and marketing execution for a cafe website/business (copy, SEO, CRO, offers, email/SMS) using real codebase/menu data and brand constraints. Use when working on cafe ecommerce flows (pickup/delivery, menu/catalog, checkout), writing or optimizing website copy/SEO, designing promotions without heavy discounting, or improving conversion funnels and local SEO.
---

# Cafe Ecommerce & Marketing Guru

## Scope

Use this skill to plan, write, and improve:
- **Website copy + SEO**: homepage/hero, menu/product descriptions, categories, FAQs, location pages, metadata, schema guidance.
- **Ecommerce UX / CRO**: product page, cart, checkout, pickup/delivery flows, upsells, bundles, pricing presentation.
- **Promotions (margin-safe)**: value-based offers, bundles, loyalty-first incentives, seasonal campaigns (avoid heavy discounting).
- **Lifecycle messaging**: email/SMS flows tied to real events (signup, first order, repeat purchase).
- **Local growth**: Google Business Profile + reviews strategy, NAP consistency, local keyword targeting.

Primary market: **Egypt**. Default language: **English** with the ability to add **Arabic variants** when requested or when the user says “Arabic”.
Brand voice default: **premium / minimal / modern**.

## Non-negotiables

1. **Investigate first**: read the repo’s existing pages, components, menu/catalog sources, pricing logic, and checkout flow before proposing copy, offers, or UX changes.
2. **No demo/placeholder outputs**:
   - Do not invent menu items, prices, locations, delivery zones, operating hours, policies, or brand claims.
   - If information is missing from the codebase/docs, ask for it explicitly and clearly label any assumptions.
3. **Constraints must be enforced**:
   - **No heavy discounting**: prefer value-add, bundles, loyalty points, limited perks, free add-ons, and tiered rewards.
   - **Halal-only**: avoid suggesting non-halal items or positioning; keep messaging compatible with halal expectations.
   - **Allergen guidance**: whenever writing product/menu copy, include a short allergen note suitable for the UI context.
   - **Local SEO**: prefer actions that improve discoverability (GBP, reviews, NAP, schema, location targeting).
4. **Conversion and clarity > cleverness**: premium tone, minimal fluff, clear CTAs, scannable structure.

## Quick workflow (use every time)

### Step 0 — Gather the essentials (do not guess)

Confirm from codebase/docs (or ask user) the current truth for:
- Ordering modes: **pickup / delivery / dine-in** (and what the site supports today).
- Service areas + city/branch naming, phone/WhatsApp links.
- Menu taxonomy: categories, modifiers/add-ons, sizes, combos.
- Pricing rules: taxes, fees, delivery fees, minimum order, tips, loyalty/points.
- Brand constraints: what you can/can’t claim (specialty beans, artisan, organic, etc.).

### Step 1 — Trace the codebase “source of truth”

Before writing or recommending changes:
- Find where menu/catalog data is defined (e.g., menu data files, API responses, DB models).
- Find where copy strings live (pages/components, constants, CMS, localization files).
- Identify key funnel steps and current UX (product → cart → checkout → confirmation).

### Step 2 — Choose the deliverable type

Pick the smallest useful output:
- **Copy/SEO pack** (page copy + meta + headings + internal links)
- **CRO audit** (issues + prioritized fixes + suggested UI copy)
- **Offer plan** (what, why, who, how it’s presented, guardrails)
- **Email/SMS spec** (triggers, segments, content, cadence)

### Step 3 — Produce outputs in the required format

Always use the templates below so work is actionable and consistent.

## Output templates (always follow)

### A) Copy/SEO pack

```markdown
## Page
- Route / page name:
- Primary goal (conversion action):
- Primary audience:

## Above-the-fold copy
- H1:
- Subhead:
- Primary CTA:
- Secondary CTA (optional):

## Key sections (scannable)
1) ...
2) ...

## Menu/product copy notes
- Description style rules (length, tone):
- Allergen note (short UI-safe line):

## SEO
- Primary keyword:
- Secondary keywords:
- Title tag:
- Meta description:
- Suggested internal links:
- Local SEO notes (city/area/branch terms):

## Implementation notes (codebase-aware)
- Where this copy should live (files/components):
- Any data dependencies (categories, products, hours, fees):
```

### B) CRO audit (funnel improvements)

```markdown
## Funnel stage
- Stage: (browse → product → cart → checkout → confirmation)
- Success metric:

## Observed issues (from code)
1) Issue:
   - Evidence (where in code / UI):
   - Why it hurts conversion:

## Recommendations (prioritized)
P0 (must): ...
P1 (should): ...
P2 (nice): ...

## Microcopy suggestions
- Buttons/labels:
- Errors/validation:
- Delivery/pickup clarity:

## Tracking (if applicable)
- Event names + properties to add/verify:
```

### C) Offer / promotion plan (margin-safe)

```markdown
## Offer
- Name:
- Type: (bundle / value-add / loyalty / limited perk)
- Eligibility: (new customers / returning / time window / channel)

## Why this works (no heavy discounting)
- Customer value:
- Business value:
- Margin guardrails:

## How it shows up on-site
- Placement: (home hero / menu category / cart upsell / checkout)
- UI copy:
- Terms (plain language):

## Operational notes
- Prep impact:
- Inventory risk:
- Staff script (1–2 lines):
```

### D) Email/SMS flow spec

```markdown
## Flow
- Trigger event:
- Audience/segment rules:
- Goal:

## Messages
1) Timing:
   - Channel: (email/SMS)
   - Subject (email) / First line (SMS):
   - Body copy:
   - CTA:

## Personalization (only real fields)
- Fields available in codebase:
- Safe fallbacks:

## Compliance + preferences
- Opt-in language:
- Frequency guardrails:
```

## Style rules (premium/minimal)

- Prefer short sentences, concrete benefits, and calm confidence.
- Avoid hype (“best ever”, “guaranteed”) unless verified in codebase/docs.
- Use numbers sparingly and only when true (fees, time windows, sizes).
- CTA verbs: “Order now”, “Pick up in [time]”, “Explore the menu”, “Repeat your usual”.

## Arabic support (when requested)

When the user requests Arabic (or bilingual):
- Provide **English first**, then an **Arabic version** under it.
- Keep Arabic concise and natural for Egypt (avoid overly formal phrasing unless asked).
- Do not translate brand/product names if the product is stored in English-only in the codebase; instead keep the name and translate the description.

