---
paths:
  - "src/components/**/*.tsx"
  - "src/app/**/*.tsx"
---

## Component Standards

- Named exports only — no `export default`
- Explicit `interface` for every component's props
- `"use client"` only when necessary (event handlers, hooks, animations)
- Never raw `<img>` — always `next/image`
- Never hardcoded strings — always `useTranslations()`
- Use `cn()` for conditional Tailwind classes

## RTL-Safe Tailwind
Use directional utilities that flip automatically in RTL:
- `ms-*` / `me-*` instead of `ml-*` / `mr-*`
- `ps-*` / `pe-*` instead of `pl-*` / `pr-*`
- `start-*` / `end-*` instead of `left-*` / `right-*`
- `text-start` / `text-end` instead of `text-left` / `text-right`

## Framer Motion in Components
Always include reduced motion check:
```tsx
const prefersReduced = useReducedMotion()
```
Always `viewport={{ once: true }}` on scroll animations.
