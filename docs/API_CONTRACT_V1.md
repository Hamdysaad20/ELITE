# API Contract v1

Base URL: `https://<backend>/api`

## Auth
- POST `/auth/login` (v1 stub): accepts email/password, returns token + user summary.
- GET `/auth/me`: returns user profile + loyalty summary (points, level). In v1, loyalty may be placeholder zeroes.

## Catalog
- GET `/products`
  - Query: `category`, `search`, `availability`, `page`, `pageSize`.
  - Source: Redis. If cache empty, return 503 or guarded on-demand fill (feature flag).
- GET `/sync/status`
  - Returns `lastUpdate` (from Redis) and optional queue counts.
- GET `/products/:id`
  - Source: Redis `products:<id>`. 404 if missing.
- GET `/categories`
  - Source: Redis `categories:list`; includes `lastUpdate`.

## POS
- GET `/pos/availability`
  - Cached 30–60s in Redis.
  - Response: `{ hasPos, configs: [{id,name,openSessionId}], ping? }`.
- (Optional later) POST `/pos/orders` behind feature flag.

## Orders
- POST `/orders`
  - Body: `{ items:[{productId, quantity, unitPrice}], notes?, orderType, paymentMethod, userId?, partner?, pos?:{enable?:bool,posConfigId?,posConfigName?,customerNotePerLine?} }`.
  - Behavior: validate → write to DB → enqueue Odoo sale (and optional POS) sync → respond with order + integrationStatus `{ sale: pending|synced|failed, pos: pending|synced|failed }`.
  - Idempotency: server uses `client_order_ref = order.id` when syncing to Odoo.
- GET `/orders/:id`
  - Returns DB state including integrations (saleOrderId, posOrderId, webUrl, statuses).
- GET `/orders/:id/status`
  - Lightweight status: sale/pos ids, Odoo statuses, URL.

## Sync (internal/admin)
- POST `/sync/products`
  - Protected by admin token/role.
  - Triggers Odoo → Redis sync; records sync_runs row; returns counts + `sync:last_update`.

## Error Model
- `{ success: false, error: string, code?: string }` with HTTP status codes.
- 429 on rate limits; 401/403 on auth; 503 when cache empty and upstream unavailable.

## Idempotency & Rate Limits
- Orders: server-side idempotency via `client_order_ref`. Clients should avoid resubmitting rapidly; apply rate limit per IP/user.
- Sync: rate limit admin endpoint; cron is primary trigger.

