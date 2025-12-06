# Odoo Integration (JSON-RPC)

This guide explains how this project integrates with Odoo so website orders are created in Odoo's Sales module (`sale.order`) and, optionally, in Point of Sale (`pos.order`) to appear on the Kitchen Display.

## What’s in this repo

- Client wrapper: `src/server/utils/odooClient.ts`
  - JSON-RPC auth via `common.authenticate` (supports Odoo API keys)
  - Helpers: `ping`, `searchRead`, `searchCount`, `modelExists`
  - Entities: find/create `res.partner`, find/create `product.product`
  - Orders: `createSaleOrderFromWebsiteOrder`, `confirmSaleOrder` (calls `sale.order.action_confirm`)
- Odoo endpoints (diagnostic/admin):
  - Diagnostics: `GET /api/odoo/orders` → configured, ping, hasSale, productCount
  - Create order: `POST /api/odoo/orders` → creates quotation; optional confirmation
  - Test order: `POST /api/odoo/order-test` → minimal single-item test
  - List products: `GET /api/odoo/products` → supports random sampling, field selection, expansions
  - POS diagnostics: `GET /api/odoo/pos` → pos.configs and open sessions
  - Create POS order: `POST /api/odoo/pos/orders` → creates `pos.order` via `create_from_ui` so it shows in Kitchen Display
  - Production endpoints: use `/api/products` (cache-backed) and `/api/orders` (DB + queue + Odoo sync). `/api/odoo/*` is diagnostic-only.

## Prerequisites

1. Odoo Online or On‑Prem reachable over HTTPS.
2. Database name (e.g. `mydb`).
3. A user with permissions for `res.partner`, `product.product`, and `sale.order` (Sales app must be installed). On Odoo 19+, prefer API keys over passwords.
4. For Kitchen Display: install and configure Point of Sale (Restaurant) and open a POS session. Products must be available in POS.

## Environment variables

Set these in `.env` or `.env.local` (API key is preferred over password):

```
ODOO_HOST=https://your-odoo.odoo.com
ODOO_DB=your_db
ODOO_USERNAME=your_user@example.com
ODOO_API_KEY=your_api_key   # preferred
# ODOO_PASSWORD=optional_password_fallback
ODOO_TIMEOUT_MS=20000       # optional
ODOO_INSECURE_SSL=true      # dev only; allows self-signed certs
```

Restart the dev server after changing env vars.

## How it works

1. Authenticate via JSON-RPC `common.authenticate(db, username, apiKeyOrPassword, {})`.
2. Execute methods via `object.execute_kw(model, method, args, kwargs)` at `/jsonrpc`.
3. Idempotency: we set `sale.order.client_order_ref` to your external order number to avoid duplicates.

### Data mapping (website → Odoo)

- Website Order → `sale.order`
  - `partner_id`: resolved/created from provided partner details
  - `client_order_ref`: website orderNumber/id (idempotency key)
  - `order_line`: list of `(0, 0, { ... })` create commands

- Website Order Item → `sale.order.line`
  - `product_id`: lookup by `default_code` (SKU = `menuItemId`), fallback by name, create minimal product if missing
  - `product_uom_qty`: `quantity`
  - `price_unit`: `unitPrice`
  - `name`: item name

## Endpoints

### Diagnostics
GET `/api/odoo/orders`

Response:
```
{
  "success": true,
  "data": {
    "configured": true,
    "ping": { "uid": 2, "partnerCount": 42 },
    "hasSale": true,
    "productCount": 123
  }
}
```

### Create order (and optionally confirm)
POST `/api/odoo/orders`

Request body:
```
{
  "partner": { "name": "John Doe", "email": "john@example.com", "phone": "+15550100", "street": "123 Main St", "city": "Cairo", "zip": "11511" },
  "items": [ { "menuItemId": "WATER-500ML", "name": "Water 500ml", "quantity": 14, "unitPrice": 10 } ],
  "notes": "API test order",
  "autoConfirm": true,
  "orderNumber": "WEB-123",   
  "userId": "user-42"
}
```

Response:
```
{
  "success": true,
  "data": {
    "saleId": 123,
    "quotationNumber": "WEB-123",
    "confirmed": true,
    "webUrl": "https://your-odoo.odoo.com/web#model=sale.order&id=123&view_type=form"
  }
}
```

Where it appears in Odoo:
- `confirmed: true` → Sales → Orders
- `confirmed: false` → Sales → Quotations

### Test order (single item)
POST `/api/odoo/order-test`

Body (example):
```
{ "quantity": 2, "itemName": "Water", "unitPrice": 10, "menuItemId": "WATER" }
```

Response includes `saleId` and `webUrl`.

### List products (with sampling and expansions)
GET `/api/odoo/products`

Query params:
- `model`: `product.product` (default) or `product.template`.
- `limit` or `sample`: number of items; required when `random=true`.
- `random`: boolean; if true, samples a random window.
- `includeInactive`: boolean; include products where `active=false`.
- `fields`: csv fields to return (default set); use `fields=all` for all readable.
- `expand`: csv among `category,uom,taxes,template,attributes,images` to include related entities.
- `imageSize`: `image_128|image_1024|image_1920` (default `image_128`).
- `page`, `pageSize`: optional pagination when not using `random`.

Notes:
- When `expand` is used, required link IDs are auto-included even if not specified in `fields`.
- Expansions return nested objects: e.g. `category: { id, name }`, `uom: { id, name }`, `taxes: [{ id, name, amount }]`, `template: {...}`, `attributes: [{ attribute, values }]`, and image bytes in the chosen `imageSize` field.
- No hidden default limit: if you omit `limit` and `random=false`, it returns all matching records (or paginate via `page`/`pageSize`).

Examples:
- Basic: `/api/odoo/products`
- Random sample: `/api/odoo/products?limit=20&random=true`
- All fields: `/api/odoo/products?fields=all`
- With related info: `/api/odoo/products?expand=category,uom,taxes`
- With attributes and images: `/api/odoo/products?model=product.product&expand=attributes,images&imageSize=image_1024&limit=100`

### POS diagnostics
GET `/api/odoo/pos`

Response:
```
{
  "success": true,
  "data": {
    "configured": true,
    "ping": { "uid": 2, "partnerCount": 42 },
    "hasPos": true,
    "posConfigs": [{ "id": 1, "name": "Main Register" }],
    "openSessions": [{ "configId": 1, "sessionId": 5, "name": "Main Register" }]
  }
}
```

### Create POS order (Kitchen Display)
POST `/api/odoo/pos/orders`

Request body:
```
{
  "partner": { "name": "Table 7" },
  "items": [ { "menuItemId": "LATTE-MED", "name": "Latte (M)", "quantity": 2, "unitPrice": 30 } ],
  "notes": "No sugar",
  "orderNumber": "WEB-123",
  "posConfigName": "Main Register"   // or posConfigId
}
```

Response:
```
{
  "success": true,
  "data": {
    "posOrderId": 456,
    "orderNumber": "WEB-123",
    "webUrl": "https://your-odoo.odoo.com/web#model=pos.order&id=456&view_type=form"
  },
  "message": "POS order created (sent to kitchen if Kitchen Display is configured)"
}
```

Kitchen Display requirements and notes:
- You must have at least one open POS session (Odoo → Point of Sale → open the POS UI). The diagnostics endpoint shows which configs have an open session.
- Products used must be available in POS. The integration auto-enables `available_in_pos` on the product template when creating items.
- Ensure the Kitchen Display is enabled and linked to the POS configuration in Odoo (Restaurant features). The order should appear automatically once created via POS.

## Troubleshooting

- 400 with message about `'sale.order' model` → Install the Sales app (`sale_management`) in your Odoo DB.
- 401/403 or auth failures → Check `ODOO_HOST`, `ODOO_DB`, `ODOO_USERNAME`, and prefer `ODOO_API_KEY`.
- Can’t find the order in Odoo → Use `webUrl` from the API response, or search by Customer Reference (your `orderNumber`). Clear default filters in Odoo list views.
- SSL issues in dev → Set `ODOO_INSECURE_SSL=true` temporarily (not for production).

---

If you need XML-RPC or webhooks for two‑way sync, open an issue and we’ll extend the integration.
