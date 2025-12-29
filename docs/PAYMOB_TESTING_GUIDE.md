# Paymob Integration Testing Guide

## ✅ Completed Steps

1. **Database Migration**: ✅ Applied successfully
   - `PaymentTransaction` model created
   - `Order` model updated with Paymob fields

2. **Environment Variables**: Check your `.env.local` file contains:
   ```bash
   PAYMOB_API_KEY=your_api_key
   PAYMOB_SECRET_KEY=your_secret_key
   PAYMOB_PUBLIC_KEY=your_public_key
   PAYMOB_HMAC_SECRET=your_hmac_secret
   PAYMOB_INTEGRATION_ID=your_integration_id
   PAYMOB_ENVIRONMENT=sandbox  # or 'production'
   ```

## 🔧 Webhook Configuration

### Step 1: Get Your Webhook URL

For **production**:
```
https://yourdomain.com/api/payments/webhook
```

For **local testing** (using ngrok):
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000

# Use the ngrok URL:
https://your-ngrok-url.ngrok.io/api/payments/webhook
```

### Step 2: Configure in Paymob Dashboard

1. Log in to [Paymob Dashboard](https://accept.paymob.com/)
2. Go to **Settings** → **Developers** → **Webhooks**
3. Set both callback URLs to your webhook URL:
   - **Transaction Processed Callback URL**: `https://yourdomain.com/api/payments/webhook`
   - **Transaction Response Callback URL**: `https://yourdomain.com/api/payments/webhook`
4. Copy your **HMAC Secret** and ensure it matches `PAYMOB_HMAC_SECRET` in your `.env.local`
5. Click **Save**

## 🧪 Testing the Integration

### Test 1: Verify Configuration

Run the test script:
```bash
npx tsx scripts/test-paymob-integration.ts
```

This will verify:
- ✅ Environment variables are set
- ✅ Paymob client can be created
- ✅ Payment service is available
- ✅ Database connection works
- ✅ PaymentTransaction model exists

### Test 2: Create a Test Order

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Create a test order**:
   - Go to your website
   - Add items to cart
   - Go to checkout
   - Select **Card** or **Wallet** as payment method
   - Complete the order

3. **Expected Flow**:
   - Order is created with `paymentStatus: PENDING`
   - Payment intent is created automatically
   - You're redirected to `/payment/process?orderId=...&paymentKey=...`
   - Paymob payment form loads
   - Complete payment using test card (see below)

### Test 3: Use Paymob Test Cards

In **sandbox mode**, use these test cards:

**Successful Payment**:
- Card Number: `4987654321098769`
- CVV: `123`
- Expiry: Any future date (e.g., `12/25`)
- Cardholder Name: Any name

**Failed Payment**:
- Card Number: `5123456789012346`
- CVV: `123`
- Expiry: Any future date

### Test 4: Monitor Webhook

After completing payment:

1. **Check server logs** for:
   ```
   [Paymob Webhook] Processing webhook...
   [Payment] Order payment status updated to PAID
   ```

2. **Check database**:
   ```sql
   SELECT * FROM "PaymentTransaction" ORDER BY "createdAt" DESC LIMIT 1;
   SELECT * FROM "Order" WHERE "paymentStatus" = 'PAID' ORDER BY "createdAt" DESC LIMIT 1;
   ```

3. **Verify order status**:
   - Order `paymentStatus` should be `PAID`
   - `paymobTransactionId` should be set
   - PaymentTransaction record should exist with `status: 'success'`

### Test 5: Verify Downstream Actions

After successful payment, verify:

1. **Odoo Sync**: Order should sync to Odoo (if configured)
   - Check Odoo dashboard
   - Or check order `odooStatusSale` field

2. **Loyalty Points**: Points should be awarded (if order is DELIVERED/COMPLETED)
   - Check `LoyaltyLedger` table
   - Or check user's loyalty account

## 🐛 Troubleshooting

### Payment Intent Creation Fails

**Symptoms**: Order created but no payment redirect

**Check**:
- Server logs for payment intent errors
- Environment variables are correct
- Paymob API credentials are valid
- Integration ID matches Paymob dashboard

### Webhook Not Received

**Symptoms**: Payment completed but order status not updated

**Check**:
- Webhook URL is publicly accessible
- Webhook URL is correct in Paymob dashboard
- Server is running and accessible
- Check server logs for incoming requests
- Verify HMAC secret matches

### HMAC Verification Fails

**Symptoms**: Webhook received but rejected

**Check**:
- `PAYMOB_HMAC_SECRET` matches Paymob dashboard
- HMAC secret hasn't been regenerated
- Webhook payload structure is correct

### Payment Form Not Loading

**Symptoms**: Redirected to payment page but form doesn't appear

**Check**:
- Browser console for JavaScript errors
- Paymob Accept.js SDK is loading
- Public key is correct
- Payment key is valid (not expired)

## 📊 Monitoring

### Key Metrics to Monitor

1. **Payment Success Rate**: `PaymentTransaction` with `status: 'success'`
2. **Webhook Processing**: Check `webhookReceived` and `webhookProcessedAt` fields
3. **Failed Payments**: `PaymentTransaction` with `status: 'failed'`
4. **Pending Payments**: `PaymentTransaction` with `status: 'pending'` (should be temporary)

### Database Queries

```sql
-- Payment success rate
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM "PaymentTransaction"
GROUP BY status;

-- Recent payment transactions
SELECT 
  pt.*,
  o."clientOrderRef",
  o."total"
FROM "PaymentTransaction" pt
JOIN "Order" o ON pt."orderId" = o.id
ORDER BY pt."createdAt" DESC
LIMIT 10;

-- Failed webhook processing
SELECT *
FROM "PaymentTransaction"
WHERE "webhookReceived" = false
  AND "status" != 'pending'
ORDER BY "createdAt" DESC;
```

## 🚀 Going Live

Before going to production:

1. ✅ Test all payment methods (Card, Wallet, etc.)
2. ✅ Verify webhook is working correctly
3. ✅ Test error scenarios (failed payments, cancellations)
4. ✅ Update `PAYMOB_ENVIRONMENT=production` in production environment
5. ✅ Update webhook URLs to production domain
6. ✅ Verify HMAC secret in production environment
7. ✅ Monitor first few transactions closely

## 📝 Next Steps

1. Run the test script: `npx tsx scripts/test-paymob-integration.ts`
2. Configure webhook URLs in Paymob dashboard
3. Test with a real order using sandbox test cards
4. Monitor webhook logs and database records
5. Once verified, switch to production environment

