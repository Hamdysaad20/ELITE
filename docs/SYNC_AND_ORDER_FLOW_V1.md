# Sync and Order Flow v1

## Product Sync (Odoo → Redis)
- Trigger: cron (every 5–10 min) + POST `/sync/products` (admin).
- Steps:
  1) Fetch from Odoo (`product.product` or fallback `product.template`) with fields: `id,name,default_code,list_price,categ_id,active,available_in_pos,uom_id,taxes_id,product_tmpl_id,image_128|1024|1920`, plus attributes when available.
  2) Normalize DTO:
     - `id`, `title=name`, `sku=default_code`, `price=list_price`, `categoryId=categ_id`, `available=active && sale_ok`, `images` (data or CDN), `uom`, `taxes`, `attributes`.
  3) Write Redis keys:
     - `products:<id>` full record.
     - `products:list:{page}:{pageSize}:{filtersHash}` for common slices.
     - `categories:list`.
     - `sync:last_update` (ISO), `sync:etag` (hash of payload).
  4) Record sync_runs row in Postgres with counts/duration/status.
- Failure handling: if fetch/normalize fails, do not overwrite existing cache; log and mark sync_runs as failed. Apply timeouts/retries around Odoo calls.

## POS Availability
- GET `/pos/availability`:
  - Uses Odoo client: `ping()`, `modelExists('pos.order')`, `getPosConfigs()`, `getOpenPosSession(configId)`.
  - Cache response in Redis for 30–60s.
  - Feature flag to disable POS order creation when no open session.

## Order Flow (DB-first, async Odoo)
- POST `/orders`:
  1) Validate payload; compute totals.
  2) Write order + items to Postgres (status PENDING, paymentStatus PENDING).
  3) Enqueue Odoo sync job payload: `{ orderId, mode: sale|pos|both, clientOrderRef }`.
  4) Respond with order and `integrationStatus` set to `pending`.
- Worker (Odoo sync):
  - Uses `createSaleOrderFromWebsiteOrder` (idempotent by client_order_ref).
  - Optional `confirmSaleOrder` when enabled.
  - Optional POS: `createPosOrderFromWebsiteOrder` (requires open session; ensure `available_in_pos` on template).
  - Updates order with `saleOrderId`, `posOrderId`, `webUrl`, and statuses `synced|failed`.
  - Retries with backoff; on terminal failure, keep order intact and mark integrationStatus failed.

## Data Sources of Truth
- Catalog: Redis cache populated from Odoo; Postgres snapshot optional for history.
- Orders: Postgres is the source of truth; Odoo is downstream copy.
- Loyalty: Postgres (loyalty_accounts + ledger).

## Idempotency & Safety
- `client_order_ref = order.id` when creating sale orders in Odoo.
- Queue jobs should be idempotent; retries safe.
- Product sync keyed by ETag: skip write when no changes (optional optimization).

