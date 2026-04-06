# ELITE Coffee Shop — Claude Code Instructions

## Project Overview
Next.js 15 App Router + TypeScript + Tailwind CSS v3 + Framer Motion + GSAP.
Full-stack coffee shop: landing page, ordering, loyalty points, Odoo ERP integration.
Bilingual RTL support: English (`en`) and Arabic (`ar`).

## Stack
- **Runtime**: Node 20+
- **Framework**: Next.js 15 App Router (`src/app/[locale]/`)
- **Styling**: Tailwind CSS v3 + `tailwind-merge` + `tailwindcss-animate`
- **Animations**: Framer Motion v12 + GSAP v3
- **i18n**: next-intl v4, locales: `en` (default), `ar` (RTL)
- **Auth**: NextAuth v4 + Prisma adapter
- **DB**: Prisma v5 + PostgreSQL
- **Cache**: Redis v4
- **Queue**: BullMQ
- **Images**: Replicate API (AI generation)
- **Monitoring**: Sentry v8
- **Tests**: Vitest + Playwright

## Dev Commands
```
npm run dev          # port 3000 (0.0.0.0)
npm run dev:turbo    # with Turbopack
npm run build        # prisma generate + next build
npm run lint         # tsc --noEmit + next lint
npm run format       # biome format --write
npm run test         # vitest run
npm run test:watch   # vitest watch
```

## CRITICAL: Formatter is Biome
**Use `npx @biomejs/biome format --write <file>` NOT Prettier.**
Biome config is at `biome.json`. Never run `prettier`.

## File Structure
```
src/
  app/[locale]/          # All pages (locale-prefixed)
  components/            # PascalCase React components
  hooks/                 # useCamelCase custom hooks
  lib/                   # Utilities and shared logic
  messages/en.json       # English translations
  messages/ar.json       # Arabic translations
  app/globals.css        # Global styles only
public/images/           # Static images (use next/image always)
prisma/                  # Database schema and migrations
scripts/                 # Background workers
```

## Code Rules
- TypeScript strict mode — no `any`, use `unknown` or proper types
- Named exports only from component files (no default exports)
- Always type component props with `interface`
- Use `cn()` from `tailwind-merge`/`clsx` for conditional classes
- Prefer Server Components; `"use client"` only when necessary
- All user-facing text via `useTranslations()` — no hardcoded strings
- Always use `next/image`, never raw `<img>` tags
- Always use `next/font`, never manual font imports

## RTL / i18n Rules
- Use `ms-*`/`me-*` (margin-start/end) instead of `ml-*`/`mr-*`
- Use `ps-*`/`pe-*` instead of `pl-*`/`pr-*`
- Root element needs `dir={locale === 'ar' ? 'rtl' : 'ltr'}`
- Test EVERY UI change in BOTH `/en` and `/ar` routes
- Arabic locale uses right-to-left text — verify with Playwright

## Animation Rules (Framer Motion + GSAP)
- Framer Motion for React component animations and page transitions
- GSAP for scroll-triggered, complex timeline, and SVG animations
- Use `useReducedMotion()` hook — respect `prefers-reduced-motion`
- Viewport animations: `whileInView` with `viewport={{ once: true }}`
- Standard durations: micro=0.1s, quick=0.2s, normal=0.3s, slow=0.6s
- GSAP: always use `gsap.context()` for cleanup in `useEffect`
- Stagger children: `staggerChildren: 0.08` in Framer variants

## Verification Steps (run after every change)
1. `npm run lint` — must pass (tsc + eslint)
2. Check visually at `localhost:3000/en` AND `localhost:3000/ar`
3. Check mobile (375px) and desktop (1440px) viewports
4. Run Lighthouse audit if touching performance-critical code
5. Run accessibility audit if touching interactive UI

## Forbidden Actions
- Never install packages without asking first
- Never delete files without explicit confirmation  
- Never modify `.env`, `.env.local`, `.env.production`
- Never commit secrets, API keys, or credentials
- Never use `prettier` — use Biome
- Never use inline styles for layout — use Tailwind
- Never commit directly to `main` — use feature branches

## MCP Tools Available (use context7 for fresh docs)
- `use context7` — adds live docs for Next.js 15, Tailwind, Framer Motion, GSAP, Prisma
- Playwright MCP — visual testing and RTL layout verification
- Lighthouse MCP — performance audits (run on localhost:3000)
- Accessibility MCP — WCAG 2.2 AA compliance checks
- Memory MCP — stores design decisions across sessions
- Sequential Thinking MCP — for complex architecture planning

## Context Files
@src/messages/en.json
@tailwind.config.ts
@prisma/schema.prisma
