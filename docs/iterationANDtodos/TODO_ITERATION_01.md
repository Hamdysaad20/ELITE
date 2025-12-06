# Iteration 01 – Implementation TODOs

Scope: Align web/mobile with the new backend (cache-backed catalog, DB orders, queued Odoo sync) and prepare for Odoo 19.

## Backend/API
- Add `/api/orders/:id/status` (or include status in list) to expose `odooStatusSale/Pos` + Odoo URLs for UI polling.
- Include `lastUpdate` (Redis `sync:last_update`) in `/api/products` and `/api/categories` responses.
- Mark legacy Odoo endpoints (`/api/odoo/orders`, `/api/odoo/pos/orders`, `/api/odoo/products`) as diagnostics-only or retire them; keep the new `/api/orders` as the canonical path.
- Add cron guidance to call `/api/sync/products` every 5–10 minutes (Vercel/Cloud Run Scheduler).
- Document worker run command for prod: `npm run worker:odoo` (requires `REDIS_URL`); ensure deployment runs API + worker.

## Catalog & Cart
- Switch frontend catalog to `/api/products` + `/api/categories`; keep `USE_LOCAL_MENU` only for dev fallback.
- Validate cart add/pricing against `/api/products/:id` (or move cart to DB/Redis) and drop reliance on static `menuData`.
- Replace `x-user-id: demo-user` with real auth/user ID once auth stub is ready.

## Auth & Identity
- Implement an auth stub (or real auth) so user IDs flow through cart and orders; update `useCart`/order creation to use it.

## Observability
- Add `/api/sync/status` (or augment `/api/health`) to report sync freshness (`sync:last_update`) and queue depth (optional).

## Documentation Updates (Odoo 19)
- Update `ODOO_INTEGRATION.md` and `BACKEND_SCAFFOLD_V1.md` with Odoo 19 notes:
  - Prefer `ODOO_API_KEY`; password is legacy.
  - POS needs open session + `available_in_pos`; images remain `image_1024/1920`.
  - Timeouts/backoff and queue recommended; diagnostics endpoints are for admin only.

