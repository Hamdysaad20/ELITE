---
paths:
  - "src/components/**/*.tsx"
  - "src/app/**/*.tsx"
  - "src/hooks/**/*.ts"
---

## Animation Rules

### Always
- Check `useReducedMotion()` and disable/simplify animations when true
- Use `transform` and `opacity` only — never animate `width`, `height`, `top`, `left`
- Framer scroll animations: `viewport={{ once: true }}`
- GSAP: wrap in `gsap.context()`, call `.revert()` in `useEffect` cleanup

### Framer Motion
- `AnimatePresence` required for mount/unmount transitions
- Stagger: max `0.12s` between items
- Spring physics for interactive (hover/tap), ease curves for scroll reveals
- Duration standards: micro=0.1s, quick=0.2s, normal=0.35s, slow=0.6s

### GSAP
- Always: `const ctx = gsap.context(() => { ... }, ref); return () => ctx.revert()`
- ScrollTrigger: `once: true` for reveal animations, `scrub: true` for parallax
- Register plugins at module level: `gsap.registerPlugin(ScrollTrigger)`

### Performance
- Avoid `layout` prop on Framer Motion in large lists (causes reflow)
- Don't use `will-change` on more than 3-4 elements simultaneously
- Prefer CSS `transition` for simple hover states over Framer Motion
