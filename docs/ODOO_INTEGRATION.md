# Odoo Integration Guide

> Complete guide to ELITE's Odoo ERP integration

## Overview

ELITE integrates with Odoo 17 for:
- Customer (Partner) management
- Product synchronization
- Order processing
- Inventory tracking
- Sales reporting

**Integration Method**: JSON-RPC API over HTTP/HTTPS

---

## Architecture

```
┌─────────────────────┐
│   ELITE Website     │
│  (Next.js + Prisma) │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   Odoo Client       │
│  (JSON-RPC)         │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   Odoo ERP v17      │
│  (PostgreSQL)       │
└─────────────────────┘
```

### Deployment-aware order sync

- **Serverless (Vercel/Netlify)**: order sync runs **inline** during `POST /api/orders` (reliable; no always-on worker).
- **Non-serverless (VPS/Docker/Worker service)**: order sync can run via **BullMQ queue + worker**.

---

## Sync Operations

### 1. Partner (Customer) Sync

**Triggers**:
- ✅ User signup (via NextAuth callback)
- ✅ Profile update
- ✅ Address create/update

**Implementation**: `/src/app/api/auth/[...nextauth]/route.ts`, `/src/app/api/auth/profile/route.ts`, `/src/app/api/addresses/route.ts`

### 2. Order Sync

**Trigger**: Order creation (POST `/api/orders`)

**Process**:

- **Serverless**: inline sync (awaited in the API request)
- **Non-serverless**: async via Redis queue + worker, with inline fallback if Redis is unavailable

**Implementation**:

- API entry: `/src/app/api/orders/route.ts`
- Sync service: `/src/server/services/odooSync.ts`
- Odoo client: `/src/server/utils/odooClient.ts`
- Worker bootstrap (optional): `/src/server/services/startOdooWorkerOnInit.ts`
- Queue (non-serverless): `/src/server/queue/odooQueue.ts`

### 3. Loyalty Points

**Trigger**: Order status update to DELIVERED or COMPLETED

**Process**: Award points based on order total and user tier

**Implementation**: `/src/server/services/loyalty.ts`, `/src/app/api/orders/[id]/status/route.ts`

---

## Testing

### Comprehensive Test Suite
```bash
npx tsx scripts/test-odoo-sync.ts
```

**Tests**:
1. User signup → Odoo partner creation
2. Address creation → Odoo sync
3. Order placement → Odoo sale order
4. Order status update → Loyalty points
5. Profile update → Odoo sync

**Results**: All 5 tests passing ✅

---

## Environment Variables

```bash
# Odoo Connection
ODOO_HOST=https://your-odoo-instance.com
ODOO_DB=your_database_name
ODOO_USERNAME=admin@yourdomain.com
ODOO_API_KEY=your-api-key           # preferred
# ODOO_PASSWORD=your-secure-password # fallback

# Optional
# ODOO_TIMEOUT_MS=60000
# ODOO_INSECURE_SSL=false

# Optional (recommended on Vercel to avoid worker start attempts)
# ENABLE_ODOO_WORKER=false
```

---

## Retry & Error Handling

### Automatic Retries (30-Minute Window)

If Odoo sync fails during order creation:

1. **Immediate Retry Tracking**: Error and attempt count stored in database
2. **Cron-Based Retries**: Every 5 minutes for up to 30 minutes
3. **Customer Notification**: Apology email sent if sync fails within 30-min window
4. **Manual Intervention**: Orders marked as `failed_permanent` after 30 minutes

**Key Features**:
- Max 5 retry attempts
- Customer notified before 30-min deadline
- Orders always saved (even if sync fails)
- Graceful degradation

See [Odoo Order Sync Retry System](./ODOO_ORDER_SYNC_RETRY_SYSTEM.md) for complete details.

---

## Environment Variables (Updated)

```bash
# Odoo Connection
ODOO_HOST=https://your-odoo.odoo.com
ODOO_DB=your_database_name
ODOO_USERNAME=admin@yourdomain.com
ODOO_API_KEY=your-secure-api-key
ODOO_TIMEOUT_MS=60000  # 60 seconds (default)

# Email (for customer notifications on sync failures)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_smtp_username
EMAIL_SERVER_PASSWORD=your_smtp_password
EMAIL_FROM=noreply@yourdomain.com

# Cron Security (auto-set by Vercel)
CRON_SECRET=your-vercel-cron-secret

# Optional (recommended on Vercel to avoid worker start attempts)
# ENABLE_ODOO_WORKER=false
```

---

## Related Documentation
- [System Overview](./SYSTEM_OVERVIEW.md)
- [Order Sync Serverless Report](./ODOO_ORDER_SYNC_SERVERLESS_REPORT.md)
- **[Order Sync Retry System](./ODOO_ORDER_SYNC_RETRY_SYSTEM.md)** ← New!
- [Odoo Worker Implementation](./ODOO_WORKER_IMPLEMENTATION.md)
- [Vercel Deployment](./VERCEL_DEPLOYMENT.md)
