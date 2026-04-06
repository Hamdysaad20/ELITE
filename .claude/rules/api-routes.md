---
paths:
  - "src/app/api/**/*.ts"
---

## API Route Standards

- Always validate request body with `zod`
- Return consistent shape: `{ success: true, data: ... }` or `{ success: false, error: ... }`
- Use `NextResponse.json()` with explicit status codes
- Never log sensitive data (passwords, tokens, PII)
- Wrap DB calls in try/catch, return 500 on unexpected errors
- Auth-protected routes must check session at the top before any logic
- Prisma queries: always use `select` to limit fetched fields

## Security
- Sanitize all user input before DB writes
- Use parameterized queries (Prisma does this automatically)
- Rate-limit sensitive endpoints (auth, payment, OTP)
- Never expose internal errors to clients in production
