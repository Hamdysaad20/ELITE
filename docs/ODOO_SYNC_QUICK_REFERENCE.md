# Odoo Sync - Quick Reference

## 🚀 Testing Commands

```bash
# Run full integration test suite
npx tsx scripts/test-odoo-sync.ts

# Verify data in Odoo
npx tsx scripts/verify-odoo-data.ts
```

---

## 📊 What Gets Synced

| Event | Database | Odoo | Loyalty |
|-------|----------|------|---------|
| **User Signup** | User created | Partner created | Account created (0 pts) |
| **Add Address** | Address saved | Partner updated | - |
| **Update Profile** | Profile updated | Partner updated | - |
| **Place Order** | Order created | Sale Order created | - |
| **Order Delivered** | Status updated | Already synced | Points awarded |

---

## 🔄 API Endpoints

### Update Order Status & Award Points
```http
PATCH /api/orders/:orderId/status
Content-Type: application/json

{
  "status": "DELIVERED"
}
```

**Statuses:**
- `PENDING` - Initial
- `CONFIRMED` - Payment confirmed
- `PREPARING` - Being prepared
- `READY` - Ready for pickup/delivery
- `DELIVERING` - Out for delivery
- `DELIVERED` - ✅ Awards loyalty points
- `COMPLETED` - ✅ Awards loyalty points
- `CANCELLED` - Order cancelled

---

## 💎 Loyalty Points

**Earning Rate:**
- 1 point per 10 EGP (base rate)

**Tier Multipliers:**
- 🥉 Bronze (0+ pts): 1x
- 🥈 Silver (100+ pts): 1.5x
- 🥇 Gold (500+ pts): 2x
- 💎 Platinum (1000+ pts): 3x

**Example:**
```
Order: 200 EGP
Tier: Silver (1.5x)
Points: (200 / 10) * 1.5 = 30 pts
```

---

## 🔧 Service Functions

```typescript
// Award points (automatically called on status update)
import { awardOrderPoints } from '@/server/services/loyalty';
await awardOrderPoints(orderId, userId);

// Add bonus points
import { addBonusPoints } from '@/server/services/loyalty';
await addBonusPoints(userId, 50, 'Birthday bonus');

// Deduct points
import { deductPoints } from '@/server/services/loyalty';
await deductPoints(userId, 100, 'Redeemed: Free Coffee');
```

---

## 🐛 Troubleshooting

### Check Odoo Configuration
```bash
env | grep ODOO
```

**Required:**
- `ODOO_HOST`
- `ODOO_DB`
- `ODOO_USERNAME`
- `ODOO_API_KEY` (or `ODOO_PASSWORD`)

### Check Database
```sql
-- Check loyalty accounts
SELECT * FROM "LoyaltyAccount" LIMIT 10;

-- Check loyalty ledger
SELECT * FROM "LoyaltyLedger" ORDER BY "createdAt" DESC LIMIT 10;

-- Check orders with Odoo sync status
SELECT id, "saleOrderId", "odooStatusSale", status FROM "Order" WHERE "saleOrderId" IS NOT NULL;
```

### Common Issues

**Issue:** "Odoo client not configured"  
**Solution:** Check environment variables are set

**Issue:** "Product name validation error"  
**Solution:** Already fixed - products now have fallback names

**Issue:** "Points not awarded"  
**Solution:** Order status must be DELIVERED or COMPLETED

---

## 📈 Monitoring

**Console Logs to Watch:**
```
✅ Loyalty account created for user {id}
✅ Odoo partner created: {partnerId} for user {userId}
✅ Address synced to Odoo for user {userId}
✅ Awarded {points} points to user {userId} for order {orderId}
🎉 User {userId} tier upgraded: {oldTier} → {newTier}
```

**Error Logs:**
```
❌ Failed to create Odoo partner: [details]
❌ Failed to sync address to Odoo: [details]
⚠️ Order {orderId} not found
⚠️ User {userId} has insufficient points
```

---

## ✅ Quick Health Check

```typescript
// Check Odoo connection
import { createOdooClient } from '@/server/utils/odooClient';

const client = createOdooClient();
if (client) {
  const result = await client.ping();
  console.log(`Connected! UID: ${result.uid}, Partners: ${result.partnerCount}`);
}
```

---

## 📝 Testing Checklist

Before deploying to production:

- [ ] Test user signup creates Odoo partner
- [ ] Test address sync to Odoo
- [ ] Test order placement creates sale order
- [ ] Test order status update to DELIVERED
- [ ] Verify points awarded correctly
- [ ] Check tier upgrade logic
- [ ] Test profile updates sync
- [ ] Verify Odoo web URLs work
- [ ] Check console logs for errors
- [ ] Test with real menu products

---

## 🎯 Production Deployment

1. **Environment Variables:**
   ```bash
   ODOO_HOST=https://your-instance.odoo.com
   ODOO_DB=your_database
   ODOO_USERNAME=your_username
   ODOO_API_KEY=your_api_key
   ```

2. **Database Migration:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Test Connection:**
   ```bash
   npx tsx scripts/verify-odoo-data.ts
   ```

4. **Monitor Logs:**
   - Watch for Odoo sync success/failure messages
   - Check loyalty point awards
   - Verify order syncs

---

## 📚 Documentation

- **Implementation Guide:** `/docs/ODOO_SYNC_COMPLETE.md`
- **Test Results:** `/docs/ODOO_SYNC_TEST_RESULTS.md`
- **This Guide:** `/docs/ODOO_SYNC_QUICK_REFERENCE.md`

---

**Last Updated:** December 11, 2025  
**Status:** ✅ Production Ready
