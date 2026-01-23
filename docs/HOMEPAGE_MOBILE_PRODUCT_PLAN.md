# Mobile-First Home Experience Plan

## Goals
- Treat the home page as a functional app surface: fast path to browse, purchase, and activate users.
- Prioritize mobile (≈90% traffic) while keeping desktop parity.
- Clarify auth state with obvious sign-in/CTA placement on mobile.

## Core Principles
- **Speed to value**: first taps show products/deals, not fluff.
- **Clarity**: single dominant CTA per state; avoid competing actions.
- **Trust + brand**: keep Elite visual identity but use concise copy.
- **Guided activation**: nudge new users to create an account or browse with benefits surfaced.

## Information Architecture (mobile-first)
1. **Sticky top bar**: logo left, search icon, cart, and **mobile sign CTA** (outlined pill “Sign in / Join”) on the right until authenticated.
2. **Hero strip**: concise value prop + primary CTA. Secondary “Browse menu” scrolls to products.
3. **Quick actions row**: “Browse Menu”, “Deals”, “Rewards”, “Track Order” (icons, tappable).
4. **Personalized rows**:
   - Signed in: “Reorder” + “Recommended for you” based on history.
   - New user: “Popular this week” + “Starter offers”.
5. **Deals & promos**: time-bound offers with clear savings and eligibility; keep above the fold on mobile.
6. **Product grid/sections**: category pills with horizontal scroll; lazy-load cards.
7. **Social proof & trust**: compact testimonials/ratings; keep below primary commerce blocks.
8. **Footer mini-nav**: support, FAQs, store locator link.

## User Flows
### New user (no auth)
1. Lands on home → sees top bar with **Sign in / Join** pill on the right.
2. Hero CTA: “Start your order”; secondary: “Browse menu”.
3. Scans quick actions → taps “Browse Menu” or “Deals”.
4. When adding to cart or tapping “Track Order”, prompt light auth (email/phone) with benefits (rewards, faster checkout).
5. Sticky bottom cart drawer appears only after first add; sign CTA remains in top bar until auth.

### Signed-in user
1. Lands on home → top bar replaces sign CTA with avatar/user menu; cart badge visible.
2. Hero CTA switches to “Continue shopping” or “Reorder favorites”.
3. Personalized rows shown first: “Reorder”, “Recommended”, then deals relevant to user.
4. Cart and track-order shortcuts remain persistent in top bar/quick actions.

## CTA Placement & States (mobile)
- **Top bar (mobile)**: right-aligned outlined pill “Sign in / Join” when unauthenticated; replaced by avatar when signed in.
- **Hero primary CTA**:
  - New user: “Start your order” → menu/deals with soft auth at checkout.
  - Signed in: “Reorder favorites” or “Continue shopping”.
- **Secondary CTA**: “Browse menu” anchor to product sections.
- **Persistent cart button**: badge in top bar; expands to bottom drawer.

## Desktop Notes
- Keep existing nav sign button; mirror hero CTA logic from mobile.
- Wider hero with supporting imagery; maintain same flow ordering (hero → quick actions → personalized/deals → products).

## Success Metrics
- Increase tap-through to menu/deals from home.
- Higher add-to-cart from home modules.
- Improved signup/activation rate from mobile CTA.
