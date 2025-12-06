# Data Model, Cache, and Queue (v1)

## Postgres Schema (logical)
- users
  - id (uuid, pk)
  - email (unique), name, phone
  - created_at, updated_at
- loyalty_accounts
  - user_id (pk, fk users)
  - points (int), total_spent (numeric), level (text)
  - updated_at
- loyalty_ledger
  - id (uuid, pk)
  - user_id (fk users)
  - delta_points (int), reason (text), order_id (fk orders, nullable)
  - created_at
- orders
  - id (uuid, pk)
  - user_id (fk users, nullable for guest), status, payment_status, payment_method, order_type
  - subtotal, delivery_fee, discount, total (numeric)
  - notes (text)
  - sale_order_id (int, nullable), pos_order_id (int, nullable), odoo_web_url (text, nullable)
  - odoo_status_sale (text: pending|synced|failed), odoo_status_pos (text)
  - client_order_ref (text, unique) for Odoo idempotency
  - created_at, updated_at
- order_items
  - id (uuid, pk)
  - order_id (fk orders)
  - product_id (text) // matches products:<id>
  - sku (text), name (text), category_id (text)
  - quantity (int), unit_price (numeric), total_price (numeric)
  - attributes_json (jsonb) // size/flavor/toppings or variant data
- products_snapshot (optional, for history)
  - id (text, pk) // same as product id
  - data (jsonb)
  - synced_at (timestamp)
- sync_runs
  - id (uuid, pk)
  - kind (text: products|other)
  - started_at, finished_at, duration_ms
  - status (text: success|failed)
  - item_count (int), error (text)

## Redis Keys
- `products:<id>` → Product DTO
- `products:list:{page}:{pageSize}:{filtersHash}` → array of summary DTOs
- `categories:list` → array of categories
- `sync:last_update` → ISO timestamp
- `sync:etag` → hash for last product payload
- `pos:availability` → cached availability (TTL 30–60s)

## DTOs (shared)
- Product: { id, title, sku, price, categoryId, available, images, attributes, uom?, taxes? }
- Category: { id, name, parentId? }
- Order: { id, userId, status, paymentStatus, paymentMethod, orderType, totals, notes, integrations { saleOrderId?, posOrderId?, url?, statusSale, statusPos }, items: [...] }
- PosAvailability: { hasPos, configs:[{id,name,openSessionId}], ping? }
- LoyaltySummary: { points, level, totalSpent }

## Queue/Workers
- Queue name: `odoo-sync`
  - Job payload: { orderId, mode: "sale"|"pos"|"both", clientOrderRef }
  - Worker updates orders table with Odoo IDs/status.
- Cron/trigger for product sync calls `/sync/products` or invokes job runner directly.

## Indexing
- orders: index on user_id, created_at, client_order_ref (unique), odoo_status_sale/pos for monitoring.
- order_items: index on order_id.
- loyalty_ledger: index on user_id, created_at.
- products_snapshot: index on synced_at for history queries.

## Timeouts/Retries (guidance)
- Odoo RPC: timeout 10–20s, retry 2–3 times with backoff for transient errors.
- Queue jobs: retry with backoff; mark failed after N attempts; idempotent via client_order_ref.

