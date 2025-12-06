# Frontend Migration to Unified API (v1)

## Goals
- Remove dependence on static `menuData` and JSON/in-memory cart/orders.
- Point all data fetches to the backend API so web and mobile share the same surface.
- Keep a dev-only fallback for local hacking when backend is absent.

## Steps
1) Configuration
   - Add `NEXT_PUBLIC_API_BASE` pointing to the backend service.
   - Feature flag `USE_LOCAL_MENU` for dev fallback.
   - Auth stub: use `/api/auth/login` to get `demo-token`; call `/api/auth/me` to populate user/loyalty.

2) Catalog
   - Replace calls to `menuData` with `/products` + `/categories`.
   - Add a small adapter to map Product DTO → UI props (id, name, price, images, category, availability).
   - For item detail pages, call `/products/:id`; render loading + error states.
   - If `USE_LOCAL_MENU` is true and API fails, fall back to local `menuData` for dev only.

3) Cart
   - Update `useCart` to call backend `/cart` (or `/orders` if cart is serverless). If keeping client cart, validate price/availability against `/products/:id` before checkout.
   - Use real user identity (from auth) instead of `demo-user`.
   - Invalidate cache via API responses instead of local memory only.

4) Orders
   - Checkout flow: POST `/orders` with items, orderType, paymentMethod, notes, partner hints; show integration status (pending/synced).
   - Order detail/history: GET `/orders/:id` (and list endpoint later) to show status and Odoo links if present.

5) Rewards
   - Consume `/auth/me` to show loyalty summary (points, level). For v1, display placeholders gracefully if loyalty not yet populated.

6) POS-aware UI (optional)
   - Call `/pos/availability` to detect if POS sync is enabled; toggle “Send to kitchen” UI accordingly.

7) Error/Resilience UX
   - Graceful fallbacks when backend unavailable: show cached/placeholder UI with retry.
   - Surface sync freshness using `sync:last_update` (optional lightweight endpoint).

8) Shared client
   - Introduce a tiny `@app/api-client` package (shared DTOs + fetch wrapper) for both web and future mobile; use it in hooks/components to reduce duplication.

