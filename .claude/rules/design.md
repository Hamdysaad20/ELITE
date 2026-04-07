---
paths:
  - "src/**/*.tsx"
  - "src/**/*.ts"
  - "src/app/globals.css"
---

# Elite Coffee — Design System Reference

This document is the authoritative design reference for every UI/UX decision in the Elite Coffee app.
Read this before writing, editing, or reviewing any component.

---

## Table of Contents

1. [Color System](#1-color-system)
2. [Typography](#2-typography)
3. [Spacing & Sizing](#3-spacing--sizing)
4. [Navigation Architecture](#4-navigation-architecture)
5. [Page Layout Patterns](#5-page-layout-patterns)
6. [Component Patterns](#6-component-patterns)
7. [Mobile Overlay Pattern](#7-mobile-overlay-pattern)
8. [RTL & i18n Rules](#8-rtl--i18n-rules)
9. [Animation Standards](#9-animation-standards)
10. [UX Flows](#10-ux-flows)
11. [Key File Tree](#11-key-file-tree)

---

## 1. Color System

### Brand Tokens (CSS custom properties + Tailwind)

| Token | Hex | Usage |
|-------|-----|-------|
| `--elite-burgundy` / `elite-burgundy` | `#8b2635` | Primary brand color. CTAs, active states, icons, borders |
| `--elite-cream` / `elite-cream` | `#f8f0d2` | Primary background. Page bg, card bg, header chrome |
| `--elite-light-cream` / `elite-light-cream` | `#fef7e0` | Lighter cream for subtle backgrounds |
| `--elite-dark-cream` / `elite-dark-cream` | `#e6d7b8` | Borders, dividers on cream surfaces |
| `--elite-black` / `elite-black` | `#2c2c2c` | Body text — NOT pure black |
| `--elite-white` | `#ffffff` | Card surfaces, modal backgrounds |

> **Rule**: Never use Tailwind `bg-white` for page backgrounds — use `bg-elite-cream`. Use `bg-white` only for elevated cards/modals on top of cream backgrounds.

### Navigation Color Tokens

These are defined in `:root` and used exclusively through CSS classes (see §4):

```css
--nav-bg-glass: rgba(248, 240, 210, 0.92)   /* frosted nav background */
--nav-border: rgba(221, 208, 184, 0.6)       /* subtle warm border */
--nav-link-default: #9C8878                  /* muted warm brown for inactive nav */
--nav-link-hover: #5C3D2E                    /* darker on hover */
--nav-link-active: #8B2635                   /* burgundy for active/current page */
--nav-deals-color: #C4683C                   /* terracotta accent for Deals */
--nav-ar-bg: rgba(139, 38, 53, 0.06)         /* icon button fill */
--nav-ar-color: #8B2635                      /* icon button icon color */
--nav-ar-border: rgba(139, 38, 53, 0.18)     /* icon button border */
--nav-pill-active: rgba(139, 38, 53, 0.08)   /* active tab background */
--nav-shadow-subtle: 0 1px 12px rgba(139, 38, 53, 0.05), 0 1px 3px rgba(0,0,0,0.04)
```

### Semantic Color Usage

```
Burgundy (#8b2635):
  ✅ CTA buttons (primary), active nav tabs, brand accents, badge borders
  ✅ Icon colors inside pill buttons
  ❌ Do not use for body text (too high contrast)

Cream (#f8f0d2):
  ✅ Page backgrounds, card backgrounds, text on burgundy buttons
  ❌ Do not use for text on cream backgrounds (invisible)

Green (emerald-500/600):
  ✅ Success states: "Added to cart", success toasts, discount badges ≥ 20% savings

Red (red-600):
  ✅ Error toasts, error states only — NOT for brand elements

Terracotta (#C4683C):
  ✅ Deals link color, cart badge on bottom nav only
```

---

## 2. Typography

### Font Stack

| Class | Variable | Font | Usage |
|-------|----------|------|-------|
| `font-calistoga` | `--font-calistoga` | Calistoga (serif) | Display headings (h1–h4), product names, prices |
| `font-cabin` | `--font-cabin-condensed` | Cabin Condensed (sans) | Body text, labels, buttons, nav links, UI copy |
| `font-arabic` | `--font-cairo` | Cairo | ALL Arabic text (RTL locale), overrides Calistoga for headings too |
| `font-bebas` | `--font-bebas` | Bebas Neue | Hero display text, large marketing headlines |
| `font-readex` | `--font-readex` | Readex Pro | Alternative for some mixed-language UI |

> **Rule**: `html[dir="rtl"]` overrides headings to Cairo automatically via globals.css. Do not manually set font on Arabic content — the root rule handles it.

### Type Scale (Mobile → Desktop)

```
Hero display:      text-5xl → text-8xl   font-bebas or font-calistoga
Section titles:    text-3xl → text-5xl   font-calistoga
Card titles:       text-base → text-2xl  font-calistoga
Body/labels:       text-sm → text-base   font-cabin
Small UI text:     text-xs → text-sm     font-cabin
Nav links:         text-[13px]           font-cabin font-medium
Bottom nav labels: text-[10px]           font-cabin
```

### Desktop Font Scale

At `min-width: 1024px`, root font-size is scaled down to `0.85` (13.6px base), and at `min-width: 1536px` to `0.8` (12.8px). This means all `rem`/`em` units naturally downscale on desktop. Do **not** try to override this — work with it.

---

## 3. Spacing & Sizing

### Nav Heights (CSS vars)

```
--nav-height-desktop: 64px   (sticky desktop header)
--nav-height-mobile: 56px    (fixed mobile top bar)
--bottom-bar-height: 68px    (fixed mobile bottom nav, excludes safe-area)
```

### Safe Area Insets

Always use `env(safe-area-inset-*)` for content near screen edges on iOS:

```tsx
// Content just below mobile top bar (overlay pages):
style={{ paddingTop: "calc(max(env(safe-area-inset-top), 8px) + 62px)" }}

// Sticky bar at bottom of screen:
className="pb-[calc(env(safe-area-inset-bottom)+12px)]"

// Spacer to prevent content behind sticky CTA bar:
<div style={{ height: "calc(env(safe-area-inset-bottom, 0px) + 88px)" }} />

// Bottom nav height including safe area:
calc(var(--bottom-bar-height) + env(safe-area-inset-bottom, 0px))
```

### Touch Targets

Minimum 44×44px for all interactive elements on mobile:
```css
/* globals.css — enforced globally on mobile */
@media (max-width: 640px) {
  button, a, [role="button"] { min-height: 44px; min-width: 44px; }
}
```

### Border Radius Scale

```
Card:           rounded-2xl (16px) mobile → rounded-3xl (24px) desktop
Modal:          rounded-t-[28px] (mobile bottom sheet) | rounded-3xl (desktop)
Pill buttons:   rounded-full (9999px)
Nav pills:      rounded-full (var(--nav-radius) = 9999px)
Icon buttons:   rounded-full
Category chips: rounded-full
Overlay cards:  rounded-[1.75rem] (28px) on mobile floating card
```

### Shadows

```
Card default:  shadow-[0_2px_8px_rgba(139,0,0,0.08),0_4px_16px_rgba(139,0,0,0.06)]
Card hover:    shadow-[0_8px_24px_rgba(139,0,0,0.12),0_4px_16px_rgba(139,0,0,0.08)]
Floating card: shadow-[0_18px_44px_rgba(139,38,53,0.14)]
Modal:         shadow-2xl
Nav:           var(--nav-shadow-subtle)
```

---

## 4. Navigation Architecture

### Breakpoint: 640px

- `< 641px` (mobile): MobileTopBar + BottomNav + Drawer
- `≥ 641px` (desktop): DesktopHeader only

Both nav systems are rendered by `src/components/Nav/index.tsx`. They share auth state via `useNavState()` hook.

### Desktop Header (`src/components/Nav/DesktopHeader.tsx`)

```
sticky top-0 z-[100] hidden min-[641px]:block
height: var(--nav-height-desktop)   → 64px
max-width: 1280px, centered
```

Layout (LTR): `[Logo] ──── [Nav pills centered absolutely] ──── [LangToggle | Avatar/CTAs]`

Nav links rendered as `NavLink` components inside a semi-transparent pill container:
```tsx
style={{
  backgroundColor: "rgba(248, 240, 210, 0.5)",
  borderRadius: "var(--nav-radius)",   // fully rounded pill group
  padding: "4px 6px",
  border: "1px solid rgba(221, 208, 184, 0.35)",
}}
```

CTA button uses `.nav-join-btn` CSS class (burgundy gradient, cream text).

### Mobile Top Bar (`src/components/Nav/MobileTopBar.tsx`)

```
fixed top-0 inset-x-0 z-[100] block min-[641px]:!hidden
height: var(--nav-height-mobile)   → 56px
```

Layout: `[Logo] ── spacer ── [LangToggle | CartBadge? | Hamburger]`

Icon buttons use inline `style` with `--nav-ar-bg`, `--nav-ar-border`, `--nav-ar-color` tokens.

**Returns `null` on overlay pages** (see §7).

### Bottom Nav (`src/components/Nav/BottomNav.tsx`)

```
.nav-bottom-bar min-[641px]:!hidden
height: var(--bottom-bar-height)   → 68px
z-index: 100
```

Active state: colored pill background + higher stroke weight + label weight 600.
Badge: terracotta gradient `linear-gradient(135deg, #C4683C, #D4784C)`.

**Returns `null` on:**
- Landing page (`/` and `/about`)
- Overlay pages (`/menu/...`, `/products/...`, `/orders/...`)

### Overlay Page Detection

Used in MobileTopBar, BottomNav, and ClientBody:

```tsx
import { stripLocaleFromPathname } from "@/i18n/routing";
const normalizedPath = stripLocaleFromPathname(pathname);
const isOverlayPage =
  /^\/menu\/.+/.test(normalizedPath) ||
  /^\/products\/.+/.test(normalizedPath) ||
  /^\/orders\/.+/.test(normalizedPath);
```

### Body Offset Padding

`ClientBody` applies `nav-body-offset` class to `<main>` to push content below nav chrome:

```tsx
<main className={
  isLandingPage || isAuthPage || isOverlayPage ? "" : "nav-body-offset"
}>
```

The CSS class:
```css
@media (max-width: 640px) {
  .nav-body-offset {
    padding-top: var(--nav-height-mobile);
    padding-bottom: calc(var(--bottom-bar-height) + env(safe-area-inset-bottom, 0px));
  }
}
```

### Drawer (`src/components/Nav/Drawer.tsx`)

Mobile-only. `.nav-drawer` CSS class handles slide-in via `transform: translateX(-100%)` → `translateX(0)`.
In RTL: `transform: translateX(100%)` → `translateX(0)`.
Always hidden (`display: none !important`) on `min-width: 641px`.

### Cart Button (`src/components/Cart/CartButton.tsx`)

Desktop-only floating action button:
```tsx
className="hidden md:flex fixed bottom-6 end-6 sm:bottom-10 sm:end-10 z-40 group"
```

Two modes controlled by `orderingEnabled`:
- Ordering ON: ShoppingCart icon → opens `CartDrawer`
- Ordering OFF: Bell icon with ping animation → calls `openSupportMessenger()`

Badge position (RTL-safe): `absolute -top-1 -end-1 sm:-top-2 sm:-end-2`

---

## 5. Page Layout Patterns

### Landing Page (`/`)

- No nav body offset
- No bottom nav
- MobileTopBar hidden (isLandingPage check)
- Full-bleed sections with `bg-elite-burgundy` root body color
- Sections: Hero → Marquee → GoodVibes → FindAndGet → LovedByLocals → HowItWorks → Testimonials → LoyaltyTeaser → SignaturePicks → Nearby → Footer

### Standard App Pages (Menu, Orders, Profile, etc.)

- `nav-body-offset` applied — content pushed below fixed nav chrome
- MobileTopBar + BottomNav visible
- Page content starts at `var(--nav-height-mobile)` from top on mobile
- Desktop: content starts at `var(--nav-height-desktop)` via `sticky` header flow

### Overlay Sub-Pages (Menu Category, Product Detail, Order Detail)

These are full-screen, native app–style pages that:
1. Hide MobileTopBar and BottomNav globally (returns null)
2. Render their own `MobileHeader` back-button bar
3. Have NO `nav-body-offset` on `<main>`
4. Content accounts for its own top padding:
   ```tsx
   style={{ paddingTop: "calc(max(env(safe-area-inset-top), 8px) + 62px)" }}
   ```

The slide-in animation for these pages:
```tsx
initial={{ x: 24, opacity: 0 }}
animate={{ x: 0, opacity: 1 }}
transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
```

### Auth Pages

- No nav chrome at all (CartButton hidden, Nav hidden)
- `OrderingProvider` initialized lazily
- Full-page centered layout

---

## 6. Component Patterns

### MobileHeader (`src/components/MobileHeader.tsx`)

Used on overlay pages as the back-button chrome. Renders only on mobile (`block md:hidden`).

```tsx
<MobileHeader
  title="Menu"       // shown centered, font-calistoga text-[15px] text-elite-burgundy
  showBack={true}    // arrow button on left (rotated 180° in RTL)
  onBack={...}       // optional custom back handler, defaults to router.back()
  showMenu={false}   // optional hamburger on right
  transparent={false} // when true: lighter bg when not scrolled
/>
```

The bar is a frosted pill:
```tsx
className="flex items-center h-[52px] px-1.5 rounded-[26px]"
style="bg-elite-cream/95 backdrop-blur-xl border border-elite-burgundy/20 shadow-md shadow-elite-burgundy/10"
```

Positioned: `fixed top-0 left-0 right-0 z-40 px-3 pt-[max(env(safe-area-inset-top),0.5rem)] pb-1.5`

> **Note**: MobileHeader uses `left-0 right-0` NOT `start-0 end-0` because it's always inside a non-RTL wrapper. The back button ArrowLeft is rotated `rotate-180` in RTL instead.

### DrinkCard (`src/components/DrinkCard.tsx`)

Three size variants: `"small" | "medium" | "large"`. Default: `"medium"`.

```tsx
<DrinkCard
  id="..."
  name="Cappuccino"
  price={45}
  images={["..."]}
  href="/menu/classic/cappuccino"
  menuItemId="..."
  showAddToOrder={true}
  size="medium"
  animationDelay={100}  // ms, staggered entrance
  dealInfo={...}        // optional DealInfo for deals page
  isDealsPage={false}
/>
```

Card structure:
```
[Rounded card bg-white]
  [Image container: rounded bg-gradient-to-b from-elite-cream/60 to-elite-burgundy/8]
    <ImageWithFallback objectFit="contain" />
    [Deal badge ≥20%: emerald FOMO badge, rotate-3]
    [Unavailable overlay: white/70 blur + "Sold Out" pill]
  [Content: font-calistoga name, font-cabin price, CTA button]
```

Hover (desktop only): `-translate-y-1.5 scale-[1.02]` + deeper shadow
Active/press: `scale-[0.98]`

CTA button states:
- Ordering OFF: white/cream with "See more →" (ChevronRight `rtl:rotate-180`)
- Ordering ON, idle: burgundy gradient, Plus icon + "Add"
- Adding: spinner
- Added: emerald gradient, Check + "Added"

### ProductModal (`src/components/menu/ProductModal.tsx`)

Quick-add modal triggered from category page. Uses `src/components/ui/Modal.tsx`.

Mobile: bottom sheet `rounded-t-[28px] max-h-[92vh]` with drag handle
Desktop: centered modal `rounded-3xl max-h-[calc(86vh-73px)]`

### ProductDetailClient (`src/components/ProductDetailClient.tsx`)

Full-screen overlay product page. Mobile layout:

```
[Full-bleed hero image: min(58vh, 480px), dark gradient overlay]
  [Product name + price overlaid in bottom-left of image]
[Cream card: -mt-5 rounded-t-[2rem] relative z-10]
  [Description, attribute selectors, quantity, related items]
  [Spacer div: height = safe-area-bottom + 88px]
[Sticky add-to-cart bar: fixed inset-x-0 bottom-0 z-50]
  [pb-[calc(env(safe-area-inset-bottom)+12px)]]
```

Desktop layout: breadcrumb + two-column (image left, details right).

### ToastProvider (`src/components/ToastProvider.tsx`)

Global toast container position:
```tsx
className="fixed z-[100] top-4 start-0 end-0 md:top-20 md:end-4 md:start-auto
           flex flex-col gap-3 w-full md:max-w-sm pointer-events-none px-4 md:px-0"
```

Mobile: full-width top strip. Desktop: right-side (start-side in RTL) panel, max-w-sm.

Toast types: `"success"` (green), `"error"` (red), `"info"` (burgundy). Default: info.

Progress bar at bottom animates scaleX 1→0 over `timeout` duration (default 4000ms).

Usage:
```tsx
const { success, error, info, push, dismiss } = useToast();
success("Order placed!");
error("Payment failed.");
info("Syncing your cart...");
push({ message: "...", type: "success", timeout: 6000 });
```

### InAppNotificationsBell (`src/components/InAppNotificationsBell.tsx`)

Used in desktop header right section. Opens a popover panel (right-aligned LTR, left-aligned RTL).

```tsx
// RTL-safe panel positioning:
className={cn(
  "absolute mt-3 w-[340px] ...",
  isRTL ? "left-0" : "right-0",
)}
```

Connects to SSE stream at `/api/notify/in-app/stream` for real-time updates.

### Skeleton Components (`src/components/skeletons/`)

Standard skeleton shimmer:
```tsx
<div className="bg-elite-burgundy/10 rounded-2xl animate-pulse" />
// OR use the shimmer variant:
<div className="relative overflow-hidden bg-elite-burgundy/8 rounded-xl">
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
</div>
```

### Floating Category Card (Menu Category Page)

Pattern for a card that "floats" on a full-bleed background image:
```tsx
className="mx-3 rounded-[1.75rem] border border-elite-burgundy/12
           bg-elite-cream/95 shadow-[0_18px_44px_rgba(139,38,53,0.14)]"
```

### Sticky Category Pills

Horizontal pill row that sticks below the MobileHeader on scroll:
```tsx
style={{ top: "calc(max(env(safe-area-inset-top), 8px) + 62px)" }}
className="sticky z-20 bg-elite-cream/95 backdrop-blur-sm border-b border-elite-burgundy/10 
           overflow-x-auto scrollbar-hide"
```

---

## 7. Mobile Overlay Pattern

Overlay pages are second-level screens that feel like native "push" navigation:

### Pages that ARE overlays

| Path pattern | Example | Own header |
|---|---|---|
| `/menu/[category]` | `/menu/classic-drinks` | MobileHeader with category title |
| `/menu/[category]/[sub]` | `/menu/classic-drinks/hot` | MobileHeader |
| `/menu/[category]/[sub]/[item]` | Product detail | MobileHeader |
| `/products/[id]` | Product detail by ID | MobileHeader |
| `/orders/[id]` | Order detail | MobileHeader |

### What changes on overlay pages

1. `MobileTopBar` → returns `null`
2. `BottomNav` → returns `null`
3. `<main>` → no `nav-body-offset` class
4. Page renders `<MobileHeader>` at top
5. Content pushes itself with `paddingTop: "calc(max(env(safe-area-inset-top), 8px) + 62px)"`
6. Page slide-in animation: `initial={{ x: 24, opacity: 0 }}`

### Pages that are NOT overlays (but still app pages)

`/menu`, `/deals`, `/profile`, `/orders`, `/rewards`, `/checkout` — these keep the global nav chrome.

---

## 8. RTL & i18n Rules

### Directional Tailwind Utilities

| ❌ Never use | ✅ Use instead |
|---|---|
| `ml-*`, `mr-*` | `ms-*`, `me-*` |
| `pl-*`, `pr-*` | `ps-*`, `pe-*` |
| `left-*`, `right-*` (for positioned elements) | `start-*`, `end-*` |
| `text-left`, `text-right` | `text-start`, `text-end` |
| `border-l-*`, `border-r-*` | `border-s-*`, `border-e-*` |
| `rounded-l-*`, `rounded-r-*` | `rounded-s-*`, `rounded-e-*` |

**Exception**: `MobileHeader` uses `left-0 right-0` (absolutely positioned, always full-width). Back arrow uses `rotate-180` in RTL instead of flipping position.

### Setting `dir` on Elements

The root `<html>` element has `dir` set by next-intl. For isolated components rendered outside this context (e.g. portals, drawers), always set `dir` explicitly:

```tsx
const locale = useLocale();
<div dir={locale === "ar" ? "rtl" : "ltr"}>
```

### Translation Keys

All user-facing strings MUST use `useTranslations()`. No hardcoded English strings in JSX.

```tsx
// ✅ Correct
const t = useTranslations("cartDrawer");
<button aria-label={t("aria.openCart")}>

// ❌ Wrong
<button aria-label="Open cart">
```

**Translation file locations:**
- `src/messages/en.json` — English (default locale)
- `src/messages/ar.json` — Arabic (RTL locale)

Both files must be updated together whenever a new key is added.

### RTL-specific layout overrides

When `start-*`/`end-*` is insufficient (e.g. absolute popover positioning), use the `isRTL` pattern:

```tsx
const isRTL = locale === "ar";
className={cn(
  "absolute ...",
  isRTL ? "left-0" : "right-0"
)}
```

### Arabic Typography Notes

- Cairo font replaces ALL fonts in RTL: body text, headings, UI labels
- Arabic text naturally needs more line-height — Cairo handles this
- Do not use `font-calistoga` or `font-cabin` on Arabic strings
- `leading-relaxed` is preferred for Arabic body text

---

## 9. Animation Standards

### Framer Motion

Duration constants:
```tsx
micro:  0.1s    // hover highlights, icon state changes
quick:  0.2s    // button presses, small transitions
normal: 0.3s    // page elements, modals
slow:   0.6s    // section reveals, hero animations
```

Standard entrance animation:
```tsx
initial={{ opacity: 0, y: 12 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
```

Overlay page slide-in:
```tsx
initial={{ x: 24, opacity: 0 }}
animate={{ x: 0, opacity: 1 }}
transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
```

Stagger children:
```tsx
const container = {
  animate: { transition: { staggerChildren: 0.08 } }
}
```

List items (e.g. DrinkCard entrance):
```tsx
// Via CSS class + animationDelay prop:
isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
transition: "opacity, transform" duration-300
```

Always use `AnimatePresence` for mount/unmount (toasts, modals, drawers):
```tsx
<AnimatePresence mode="popLayout">
  {items.map(item => <motion.div key={item.id} ... />)}
</AnimatePresence>
```

### Reduced Motion

Always check and respect:
```tsx
const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
useEffect(() => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  setPrefersReducedMotion(mq.matches);
}, []);

// Then:
const animDuration = prefersReducedMotion ? "duration-100" : "duration-300";
```

Or via Framer Motion hook:
```tsx
const prefersReduced = useReducedMotion();
```

### CSS Animations (globals.css)

| Class | Keyframe | Usage |
|---|---|---|
| `.animate-shimmer` | `shimmer` 1.5s infinite | Skeleton loading |
| `.animate-fade-in-up` | `fadeInUp` 0.4s forwards | One-time element reveal |
| `.stagger-fade > *` | `fadeInUp` with nth-child delays | List item cascade |
| `.drink-overlay-animation` | `drink-appear` 1.2s | Hero drink image |
| `.marquee-content` | `marquee-scroll` 25s linear infinite | Marquee ticker |

### GSAP Usage

```tsx
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.from(".hero-title", { y: 40, opacity: 0, duration: 0.8, stagger: 0.1 });
    ScrollTrigger.create({ trigger: ".section", once: true, onEnter: () => { ... } });
  }, containerRef);
  return () => ctx.revert();
}, []);
```

---

## 10. UX Flows

### Ordering Enabled vs Disabled (`OrderingContext`)

```tsx
const { orderingEnabled } = useOrdering();
```

- **Enabled (`true`)**: Show "Add to Order" / "Checkout" flows, CartButton shows ShoppingCart
- **Disabled (`false`)**: Show "See more" / "Message us" fallbacks, CartButton shows Bell + ping animation pointing to support

Every component that shows an add-to-cart action MUST check `orderingEnabled`.

### Menu Navigation Flow

```
/menu                    → All categories list (MobileTopBar visible)
  /menu/[category]       → Overlay: category products + sticky pills (MobileTopBar hidden)
    /menu/[cat]/[sub]    → Overlay: subcategory products
      /menu/[c]/[s]/[i]  → Overlay: product detail (ItemDetailClient)
/products/[id]           → Overlay: product detail (ProductDetailClient) — accessed from deals/search
```

### Checkout Flow

```
Cart (CartDrawer or /order page)
  → /checkout (step: cart review)
    → /checkout (step: details — address, order type)
      → /checkout (step: payment method)
        → /payment/process (Paymob iframe/redirect)
          → /payment/callback (status check)
            → /order/[id] (success/failure)
```

### Auth Flow

```
Any protected action (checkout online payment) → redirect to /auth/signin
  /auth/signin → magic link email sent
    /auth/verify-request → "Check your email" page
      [email link click] → NextAuth callback
        → redirect back to original page
```

---

## 11. Key File Tree

```
src/
├── app/
│   ├── globals.css             ← CSS tokens, nav classes, animations, utilities
│   ├── layout.tsx              ← Root layout (fonts, Sentry, providers)
│   ├── ClientBody.tsx          ← Nav, Auth, Ordering, Toast providers; overlay/auth/landing detection
│   ├── [locale]/
│   │   ├── layout.tsx          ← Locale layout (next-intl, dir, lang attr)
│   │   ├── page.tsx            ← Landing page → renders LandingPage component
│   │   ├── menu/
│   │   │   ├── page.tsx        ← Category list
│   │   │   └── [category]/
│   │   │       ├── page.tsx    ← Category products (OVERLAY)
│   │   │       └── [sub]/
│   │   │           ├── page.tsx
│   │   │           └── [item]/page.tsx
│   │   ├── products/[id]/      ← Product detail (OVERLAY)
│   │   ├── orders/[id]/        ← Order detail (OVERLAY)
│   │   ├── checkout/           ← Checkout page (NOT overlay)
│   │   ├── deals/              ← Deals page
│   │   ├── profile/            ← Profile tabs
│   │   └── auth/               ← Auth pages (no nav)
│
├── components/
│   ├── Nav/
│   │   ├── index.tsx           ← Nav wrapper: renders Desktop + Mobile together
│   │   ├── DesktopHeader.tsx   ← sticky, hidden min-[641px]:block
│   │   ├── MobileTopBar.tsx    ← fixed, block min-[641px]:!hidden, null on overlay
│   │   ├── BottomNav.tsx       ← nav-bottom-bar, null on overlay + landing
│   │   ├── Drawer.tsx          ← mobile drawer, .nav-drawer CSS
│   │   ├── NavLink.tsx         ← pill link with comingSoon badge
│   │   └── LangToggle.tsx      ← language switcher button
│   ├── Cart/
│   │   ├── CartButton.tsx      ← floating FAB, desktop-only (hidden md:flex)
│   │   └── CartDrawer.tsx      ← slide-in cart panel
│   ├── menu/
│   │   └── ProductModal.tsx    ← quick-add modal from category grid
│   ├── ui/
│   │   ├── Modal.tsx           ← base modal (bottom sheet mobile / centered desktop)
│   │   ├── EmptyState.tsx      ← consistent empty states
│   │   ├── ErrorState.tsx      ← consistent error states
│   │   ├── LoadingState.tsx    ← full-page loading
│   │   └── ImageWithFallback.tsx ← multi-src image with 404 fallback
│   ├── skeletons/              ← page-specific skeleton loaders
│   ├── MobileHeader.tsx        ← back-button chrome for overlay pages
│   ├── DrinkCard.tsx           ← product card (menu + deals)
│   ├── ProductDetailClient.tsx ← full-screen product detail (overlay)
│   ├── ItemDetailClient.tsx    ← item detail from menu hierarchy (overlay)
│   ├── InAppNotificationsBell.tsx ← header bell + SSE popover
│   ├── ToastProvider.tsx       ← global toast system + context
│   ├── LocalizedLink.tsx       ← next/link with locale prefix
│   └── ... (landing sections: Hero, HowItWorks, LoyaltyTeaser, etc.)
│
├── messages/
│   ├── en.json                 ← English strings (all user-facing text)
│   └── ar.json                 ← Arabic strings (must mirror en.json keys)
│
├── context/
│   └── OrderingContext.tsx     ← orderingEnabled flag
│
├── hooks/
│   ├── useLocalCart.ts         ← cart state (localStorage-backed)
│   └── useNavState.ts          ← shared nav auth + cart count state
│
└── lib/
    ├── utils.ts                ← cn(), slugify(), stripLocaleFromPathname()
    ├── imageUtils.ts           ← sanitizeImages()
    └── support.ts              ← openSupportMessenger()
```

---

## Quick-Reference Checklist

Before submitting any UI change:

- [ ] All user-facing strings use `useTranslations()` — zero hardcoded English
- [ ] Both `en.json` and `ar.json` updated with matching keys
- [ ] Positional classes use `start-*`/`end-*`/`ms-*`/`me-*` (not left/right/ml/mr)
- [ ] Overlay pages include `MobileHeader` + no `nav-body-offset`
- [ ] Safe-area insets applied to any fixed element near screen edges
- [ ] Touch targets ≥ 44×44px on all interactive elements
- [ ] `useReducedMotion()` checked before complex animations
- [ ] `viewport={{ once: true }}` on all Framer Motion scroll reveals
- [ ] `"use client"` only added when strictly necessary (events, hooks, motion)
- [ ] Image via `next/image` or `ImageWithFallback` — never raw `<img>` (exception: nav logo)
- [ ] Visual check at `/en` AND `/ar` routes
- [ ] Visual check at 375px (mobile) AND 1440px (desktop)
