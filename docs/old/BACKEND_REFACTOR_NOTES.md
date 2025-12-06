# Backend Refactor Notes

This update introduces standardized error handling and input validation for API routes.

## What changed

- Centralized error classes in `src/server/utils/errors.ts` (e.g., `BadRequestError`, `NotFoundError`).
- Response helper `handleApiError` now maps `ApiError` to proper HTTP status codes.
- Added zod-based validators in `src/server/validators/`:
  - `cartSchemas.ts` (add item, update quantity)
  - `orderSchemas.ts` (create order)
- Refactored routes to use validation and typed errors:
  - `src/app/api/cart/route.ts`
  - `src/app/api/cart/[itemId]/route.ts`
  - `src/app/api/orders/route.ts`
- Extended `ApiResponse` to optionally include `code` and `status` for richer error responses (non-breaking).

## How to use the pattern

- Validate input with zod:
  ```ts
  const body = schema.parse(await request.json());
  ```
- Throw typed errors to control status codes:
  ```ts
  import { NotFoundError } from '@/server/utils/errors';
  if (!resource) throw new NotFoundError('Resource not found');
  ```
- Let `handleApiError` convert exceptions to JSON responses.

## Next candidates

- Add schemas for Odoo endpoints to harden inputs.
- Add pagination/query param helpers.
- Consider logging middleware and request IDs.
