# Complete Order Flow Documentation

## Overview
This document describes the complete order flow from customer adding products to cart, through order placement, database storage, and Odoo synchronization.

## Flow Steps

### 1. Customer Adds Products to Cart
- **Location**: Customer browses menu and adds items
- **Storage**: Items stored in browser localStorage via `useLocalCart` hook
- **Format**: `LocalCartItem` with product details, quantities, attributes, and prices

### 2. Customer Reviews Cart and Places Order
- **Page**: `/order` (Order Page)
- **Actions**:
  - Customer selects order type (Pickup/Delivery)
  - Customer selects payment method (Cash/Card/Wallet/Online)
  - Customer provides delivery address (if delivery)
  - Customer clicks "Place Order"

### 3. Order Creation API Call
- **Endpoint**: `POST /api/orders`
- **Request Body**:
  ```json
  {
    "paymentMethod": "CASH",
    "orderType": "DELIVERY",
    "addressId": "address-id",
    "notes": "Optional notes",
    "items": [...cartItems],
    "odoo": {
      "partner": {
        "name": "Customer Name",
        "email": "customer@email.com",
        "phone": "+20..."
      },
      "sale": {
        "enable": true,
        "autoConfirm": false
      },
      "pos": {
        "enable": false
      }
    }
  }
  ```

### 4. Order Saved to Database
- **Database**: PostgreSQL via Prisma
- **Table**: `Order` and `OrderItem`
- **Status**: `PENDING`
- **Payment Status**: `PENDING`
- **Includes**: All order items, totals, customer info, delivery address

### 5. Odoo Sync Enqueued
- **Service**: `enqueueOrderSync()` in `src/server/services/odooSync.ts`
- **Queue**: BullMQ (Redis) or fallback to inline processing
- **Configuration**:
  - `enableSale: true` - Sale order will be created in Odoo
  - `autoConfirm: false` - Order won't be auto-confirmed (for review)
  - `enablePos: false` - POS order disabled (for normal customer flow)

### 6. Cart Cleared
- **Server-side**: Cart cleared from database/in-memory store
- **Client-side**: localStorage cart cleared via `clearCart()`

### 7. Order History Saved
- **Storage**: Orders saved in database with full details
- **Retrieval**: `GET /api/orders` returns user's order history
- **Includes**: Order status, payment status, items, totals, Odoo integration status

### 8. Odoo Sync Processing (Background)
- **Worker**: Processes queue jobs via `processOrderSync()`
- **Steps**:
  1. Fetch order from database
  2. Create/find partner (customer) in Odoo
  3. For each order item:
     - Find or create product in Odoo (via `findOrCreateProduct`)
     - Products are automatically created if they don't exist
  4. Create sale order in Odoo with all items
  5. Update order in database with:
     - `saleOrderId` - Odoo sale order ID
     - `odooWebUrl` - Link to view order in Odoo
     - `odooStatusSale` - Sync status (synced/failed/skipped)

## Product Sync (Odoo → Website)
- **Script**: `POST /api/sync/products` (admin only)
- **Purpose**: Sync products FROM Odoo TO website
- **Frequency**: Can be run manually or via cron
- **Storage**: Products cached in Redis for fast access

## Order Sync (Website → Odoo)
- **Automatic**: Triggered when order is placed
- **Purpose**: Create sale order in Odoo sales portal
- **Products**: Automatically created in Odoo if they don't exist
- **Idempotency**: Uses `client_order_ref` to prevent duplicates

## Key Files

### Order Creation
- `src/app/order/page.tsx` - Order page UI
- `src/app/api/orders/route.ts` - Order creation API

### Odoo Integration
- `src/server/services/odooSync.ts` - Odoo sync service
- `src/server/utils/odooClient.ts` - Odoo client (creates sale orders, products, partners)
- `src/server/queue/odooQueue.ts` - Queue setup

### Database
- `prisma/schema.prisma` - Database schema
- `src/server/db/client.ts` - Prisma client

## Environment Variables Required
- `ODOO_HOST` - Odoo instance URL
- `ODOO_DB` - Odoo database name
- `ODOO_USERNAME` - Odoo username
- `ODOO_PASSWORD` - Odoo password
- `REDIS_URL` - Redis URL for queue (optional, falls back to inline processing)

## Worker Setup
To process Odoo sync jobs, run the worker:
```bash
npm run worker:odoo
```

If Redis is not configured, the system falls back to inline processing (synchronous).

## Order Status Flow
1. **PENDING** - Order created, awaiting processing
2. **CONFIRMED** - Order confirmed (if auto-confirm enabled)
3. **PREPARING** - Order being prepared
4. **READY** - Order ready for pickup/delivery
5. **OUT_FOR_DELIVERY** - Order out for delivery (delivery only)
6. **DELIVERED** - Order delivered
7. **CANCELLED** - Order cancelled

## Odoo Integration Status
- `synced` - Successfully synced to Odoo
- `failed` - Sync failed (will retry if queue configured)
- `skipped` - Sync skipped (Odoo not configured or disabled)

## Notes
- Orders are always saved to database first (database-first approach)
- Odoo sync happens asynchronously (non-blocking)
- If Odoo is unavailable, order still succeeds locally
- Products are automatically created in Odoo if they don't exist
- Order history is always available in the website database

