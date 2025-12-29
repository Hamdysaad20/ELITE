# 🧪 Test Purchase Steps - Quick Guide

## ✅ Pre-Flight Check Complete!

Your Paymob integration is configured:
- ✅ API Key: Set
- ✅ Secret Key: Set  
- ✅ Public Key: Set
- ✅ HMAC Secret: Set
- ✅ Integration ID: 983629
- ✅ Wallet Integration ID: 5452964
- ✅ Environment: sandbox

## 🚀 Step-by-Step Test Process

### Step 1: Start Your Server

```bash
npm run dev
```

Wait for: `✓ Ready on http://localhost:3000`

### Step 2: Open Your Website

1. Open browser: `http://localhost:3000`
2. Make sure you're logged in (or create a test account)

### Step 3: Create a Test Order

1. **Add items to cart**:
   - Browse products
   - Add 1-2 items to cart
   - Go to cart/checkout

2. **Go to checkout** (`/order` page):
   - Select **Order Type**: Pickup or Delivery
   - Select **Payment Method**: **Card** (or Wallet)
   - Fill in any required fields
   - Click **"Place Order"**

### Step 4: Complete Payment

After clicking "Place Order", you'll be redirected to:
```
/payment/process?orderId=...&paymentKey=...
```

**Use these TEST CARD details** (Sandbox):

```
Card Number: 4987654321098769
CVV: 123
Expiry: 12/25 (or any future date)
Name: Test User (or any name)
```

Click **"Pay"** or **"Submit"**

### Step 5: Verify Payment

#### A. Check Payment Status Page

After payment, you'll see:
- ✅ "Payment Successful!" message
- Link to view order

#### B. Check Paymob Dashboard

1. Go to: https://accept.paymob.com/
2. Navigate to **Transactions** or **Orders**
3. Look for your test transaction:
   - Should show amount
   - Status: "Success" or "Captured"
   - Merchant Order ID matches your order

#### C. Check Your Database

Run this query or use Prisma Studio:

```bash
npx prisma studio
```

Then check:
- **Order** table → Find your order → `paymentStatus` should be `PAID`
- **PaymentTransaction** table → Find transaction → `status` should be `success`

Or query directly:

```sql
SELECT 
  id,
  "clientOrderRef",
  "paymentStatus",
  "paymobTransactionId",
  total
FROM "Order"
ORDER BY "createdAt" DESC
LIMIT 1;
```

### Step 6: Verify Webhook (Optional)

Check if webhook was received:

```sql
SELECT 
  "webhookReceived",
  "webhookProcessedAt",
  status
FROM "PaymentTransaction"
ORDER BY "createdAt" DESC
LIMIT 1;
```

## 🐛 Troubleshooting

### Payment Form Doesn't Load

- Check browser console (F12) for errors
- Verify server is running
- Check network tab for failed requests

### Payment Completed But Order Not Updated

1. **Check webhook was received**:
   - Look in database: `webhookReceived = true`
   - Check server logs for webhook messages

2. **If webhook not received**:
   - For local testing, you need ngrok or similar
   - Or manually check Paymob dashboard
   - Order will update when webhook arrives

3. **Check server logs**:
   ```bash
   # Look for these messages:
   [Paymob Webhook] Processing webhook...
   [Payment] Order payment status updated to PAID
   ```

### Can't See Transaction in Paymob Dashboard

- Make sure you're in **TEST** mode (top of dashboard)
- Check transaction might be in "Pending" state
- Refresh the page
- Check date filter isn't hiding it

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Order created successfully
2. ✅ Redirected to Paymob payment page
3. ✅ Payment form loads
4. ✅ Payment completes with test card
5. ✅ Redirected to success page
6. ✅ Order status = `PAID` in database
7. ✅ PaymentTransaction record created
8. ✅ Transaction visible in Paymob dashboard
9. ✅ Webhook received (if configured)

## 📊 What to Check in Paymob Dashboard

After successful payment, in Paymob dashboard you should see:

- **Transaction ID**: Unique Paymob transaction ID
- **Amount**: Matches your order total
- **Status**: Success/Captured
- **Merchant Order ID**: Your order's `clientOrderRef`
- **Payment Method**: Card/Wallet
- **Date/Time**: Recent timestamp

## 🎯 Next Steps After Successful Test

1. ✅ Configure webhook URLs for production
2. ✅ Test with different payment methods (Wallet, etc.)
3. ✅ Test error scenarios (failed payment, cancellation)
4. ✅ Verify Odoo sync (if configured)
5. ✅ Verify loyalty points (if order completed)

## 💡 Pro Tips

- Keep browser console open (F12) to see any errors
- Keep server logs visible to monitor webhook processing
- Use Prisma Studio to easily check database: `npx prisma studio`
- Test with small amounts first
- Test both success and failure scenarios

---

**Ready to test?** Start your server and follow the steps above! 🚀

