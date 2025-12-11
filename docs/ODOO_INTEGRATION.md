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
│   Bull Queue        │
│  (Redis-backed)     │
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

**Process**: Async via Bull queue

**Implementation**: `/src/server/utils/odooClient.ts`, `/src/server/queues/orderQueue.ts`

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
ODOO_URL=https://your-odoo-instance.com
ODOO_DB=your_database_name
ODOO_USERNAME=admin@yourdomain.com
ODOO_PASSWORD=your-secure-password
```

---

## Related Documentation
- [System Overview](./SYSTEM_OVERVIEW.md)
- [Loyalty System](./LOYALTY_SYSTEM.md)
- [Order Flow](./ORDER_FLOW.md)
