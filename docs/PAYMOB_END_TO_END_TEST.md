# Paymob End-to-End Test Guide

This guide walks you through testing the complete Paymob payment flow from order creation to payment confirmation.

## Prerequisites

✅ All environment variables are set in `.env.local`  
✅ Database migration is complete  
✅ Paymob credentials are verified  

## Step 1: Pre-Flight Check

Run the test script to verify everything is ready:

```bash
npx tsx scripts/test-paymob-purchase.ts
```

This will:
- ✅ Verify Paymob configuration
- ✅ Test authentication
- ✅ Test order creation in Paymob
- ✅ Test payment key generation
- ✅ Verify database setup

## Step 2: Start Development Server

```bash
npm run dev
```

Your server should start on `http://localhost:3000`

## Step 3: Create a Test Order

### Option A: Through Your Website (Recommended)

1. **Open your website**: `http://localhost:3000`
2. **Add items to cart**: Add some products
3. **Go to checkout**: Navigate to `/order` page
4. **Select payment method**: Choose **Card** or **Wallet**
5. **Fill in order details**:
   - Select order type (Pickup/Delivery)
   - If delivery, select an address
   - Add any notes
6. **Click "Place Order"**

### Option B: Direct API Call (For Testing)

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "paymentMethod": "CARD",
    "orderType": "PICKUP",
    "items": [
      {
        "productId": "test-product",
        "name": "Test Product",
        "quantity": 1,
        "totalPrice": 100,
        "basePrice": 100,
        "attributes": {}
      }
    ]
  }'
```

## Step 4: Complete Payment

After placing the order, you'll be redirected to:
```
/payment/process?orderId=...&paymentKey=...
```

### Paymob Payment Page

The Paymob payment form should load. Use these **test credentials** (Sandbox):

**For Successful Payment:**
- **Card Number**: `4987654321098769`
- **CVV**: `123`
- **Expiry Date**: Any future date (e.g., `12/25`)
- **Cardholder Name**: Any name (e.g., `Test User`)

**For Failed Payment (Testing):**
- **Card Number**: `5123456789012346`
- **CVV**: `123`
- **Expiry Date**: Any future date

### Complete the Payment

1. Enter the test card details
2. Click "Pay" or "Submit"
3. You'll be redirected to `/payment/callback?orderId=...&status=...`

## Step 5: Verify Payment

### Check Paymob Dashboard

1. **Log in to Paymob Dashboard**: https://accept.paymob.com/
2. **Go to Transactions**: Look for your test transaction
3. **Verify**:
   - Transaction appears in the list
   - Status is "Success" or "Captured"
   - Amount matches your order
   - Merchant Order ID matches your order's `clientOrderRef`

### Check Your Database

Query the database to verify:

```sql
-- Check order status
SELECT 
  id,
  "clientOrderRef",
  "paymentStatus",
  "paymobTransactionId",
  total,
  "createdAt"
FROM "Order"
WHERE "paymentStatus" = 'PAID'
ORDER BY "createdAt" DESC
LIMIT 5;

-- Check payment transaction
SELECT 
  id,
  "orderId",
  "paymobTransactionId",
  status,
  amount,
  "webhookReceived",
  "webhookProcessedAt",
  "createdAt"
FROM "PaymentTransaction"
ORDER BY "createdAt" DESC
LIMIT 5;
```

Or use Prisma Studio:

```bash
npx prisma studio
```

Navigate to:
- **Order** table → Find your order → Check `paymentStatus` = `PAID`
- **PaymentTransaction** table → Find transaction → Check `status` = `success`

### Check Server Logs

Look for these log messages:

```
[Payment] Order payment status updated to PAID
[Paymob Webhook] Processing webhook...
[Payment] Order payment status updated to PAID
[Payment] Triggering Odoo sync...
```

## Step 6: Verify Webhook Processing

### Check Webhook Received

```sql
SELECT 
  "webhookReceived",
  "webhookProcessedAt",
  "webhookPayload"
FROM "PaymentTransaction"
WHERE "paymobTransactionId" IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 1;
```

### Test Webhook Manually (Optional)

If webhook wasn't received automatically, you can check the webhook endpoint:

```bash
curl -X GET http://localhost:3000/api/payments/webhook
```

Should return:
```json
{
  "success": true,
  "data": {
    "message": "Paymob webhook endpoint is active"
  }
}
```

## Step 7: Verify Downstream Actions

### Odoo Sync (If Configured)

Check if order synced to Odoo:
- Check `odooStatusSale` field in Order table
- Check Odoo dashboard for the order

### Loyalty Points (If Order is Completed)

If order status is `DELIVERED` or `COMPLETED`:
- Check `LoyaltyLedger` table for points entry
- Check user's loyalty account balance

## Troubleshooting

### Payment Form Not Loading

**Symptoms**: Redirected to payment page but form doesn't appear

**Solutions**:
1. Check browser console for JavaScript errors
2. Verify `PAYMOB_PUBLIC_KEY` is correct
3. Check that payment key is valid (not expired)
4. Verify Paymob Accept.js SDK is loading

### Payment Completed But Order Not Updated

**Symptoms**: Payment successful in Paymob but order still shows `PENDING`

**Solutions**:
1. Check if webhook was received:
   ```sql
   SELECT "webhookReceived" FROM "PaymentTransaction" WHERE "orderId" = 'your-order-id';
   ```
2. Check server logs for webhook errors
3. Verify webhook URL is configured in Paymob dashboard
4. Check HMAC secret matches
5. Manually trigger webhook processing (if needed)

### Webhook Not Received

**Symptoms**: Payment successful but no webhook in database

**Solutions**:
1. Verify webhook URL is publicly accessible
2. Check Paymob dashboard webhook configuration
3. For local testing, use ngrok:
   ```bash
   ngrok http 3000
   # Update webhook URL in Paymob dashboard to ngrok URL
   ```
4. Check server logs for incoming requests
5. Verify webhook URL format: `https://yourdomain.com/api/payments/webhook`

### HMAC Verification Failing

**Symptoms**: Webhook received but rejected

**Solutions**:
1. Verify `PAYMOB_HMAC_SECRET` matches Paymob dashboard
2. Check webhook payload structure
3. Review server logs for HMAC verification errors

## Success Criteria

✅ Order created with `paymentStatus: PENDING`  
✅ Payment intent created successfully  
✅ Redirected to Paymob payment page  
✅ Payment completed with test card  
✅ Webhook received and processed  
✅ Order `paymentStatus` updated to `PAID`  
✅ `PaymentTransaction` record created with `status: success`  
✅ Transaction appears in Paymob dashboard  
✅ Odoo sync triggered (if configured)  
✅ Loyalty points awarded (if order completed)  

## Next Steps

Once testing is successful:

1. ✅ Configure production webhook URLs
2. ✅ Switch to production environment (`PAYMOB_ENVIRONMENT=production`)
3. ✅ Update production environment variables
4. ✅ Test with real payment (small amount)
5. ✅ Monitor first few transactions closely

## Test Checklist

- [ ] Pre-flight check passed
- [ ] Dev server running
- [ ] Test order created
- [ ] Payment form loaded
- [ ] Payment completed with test card
- [ ] Order status updated to PAID
- [ ] PaymentTransaction created
- [ ] Transaction visible in Paymob dashboard
- [ ] Webhook received and processed
- [ ] Odoo sync working (if applicable)
- [ ] Loyalty points awarded (if applicable)

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Review `docs/PAYMOB_TROUBLESHOOTING.md`
3. Contact Paymob support: support@paymob.com
4. Check Paymob dashboard for transaction status

