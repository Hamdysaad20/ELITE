# Paymob Production Setup Guide

## ✅ Production Credentials (Live)

All credentials are configured and ready for production deployment.

### Environment Variables Required

#### Private (Server-side)
```env
PAYMOB_ENVIRONMENT=production

# ⚠️ IMPORTANT: Do not commit actual secrets to repository!
# Set these in Vercel/GitHub environments only
PAYMOB_API_KEY=your_paymob_api_key_here
PAYMOB_SECRET_KEY=your_paymob_secret_key_here
PAYMOB_HMAC_SECRET=your_paymob_hmac_secret_here

# Integration IDs (All 8 live integrations)
PAYMOB_INTEGRATION_ID=5421577                    # Online Card (Primary)
PAYMOB_WALLET_INTEGRATION_ID=5421576             # Mobile Wallet
PAYMOB_INTEGRATION_SUBSCRIPTION=5461543          # Subscription
PAYMOB_INTEGRATION_HOST=5435497                  # Host
PAYMOB_INTEGRATION_BALANCE_TRANSFER=5421987      # Balance Transfer
PAYMOB_INTEGRATION_CASH_COLLECTION=5421986       # Cash Collection / Deposit
PAYMOB_INTEGRATION_BILL_PAYMENT=5421985          # Bill Payment
```

#### Public (Frontend-safe)
```env
NEXT_PUBLIC_PAYMOB_PUBLIC_KEY=your_paymob_public_key_here
NEXT_PUBLIC_PAYMOB_IFRAME_ID=983628              # Custom branded iframe
```

## 🚀 Deployment Steps

### 1. Vercel Production Environment

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add all environment variables listed above
3. Set scope to **Production** (and optionally Preview/Development)
4. Click **Save**

### 2. GitHub Actions Secrets

1. Go to **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each environment variable:
   - Name: `PAYMOB_API_KEY`
   - Value: `your_paymob_api_key_here` (use actual value from your Paymob dashboard)
4. Repeat for all variables above
5. Save all secrets

### 3. Redeploy

After adding environment variables:
- **Vercel**: Go to **Deployments** → Click **⋮** on latest deployment → **Redeploy**
- **GitHub Actions**: Push a commit or manually trigger a workflow

## ✅ Features Enabled

### Payment Methods
- ✅ **Card Payment** (Online Card) - Integration ID: 5421577
- ✅ **Mobile Wallet** (Vodafone Cash, Orange Money, Etisalat) - Integration ID: 5421576
- ✅ **Installments** - Handled by custom iframe (983628)
- ✅ **Saved Cards** - Supported via Paymob tokenization (iframe-based)

### Integrations Available
All 8 live Paymob integrations are configured and ready:
1. Online Card (Primary)
2. Mobile Wallet
3. Subscription
4. Host
5. Balance Transfer
6. Cash Collection / Deposit
7. Bill Payment
8. Additional integrations available

### Wallet Auto-Detection
- ✅ Server-side routing based on payment method selection
- ✅ Paymob iframe handles wallet selection (Vodafone/Orange/Etisalat)

## 🎨 Branded Payment UI

The payment flow uses a **simple, branded custom iframe**:
- **Iframe ID**: 983628 (Installment_Discount)
- **URL**: `https://accept.paymob.com/api/acceptance/iframes/983628?payment_token={paymentKey}`
- **Features**: Installments, discounts, saved cards, all payment methods

## 🔒 Security

- ✅ All secrets are environment-based (no hardcoding)
- ✅ HMAC verification enabled for webhooks
- ✅ PCI-compliant (iframe-based, no card data in our system)
- ✅ Payment keys are short-lived (1 hour expiration)

## 📋 Verification Checklist

After deployment, verify:

1. ✅ Environment variables are set correctly
2. ✅ Payment page loads with iframe (`/payment/process?orderId=...&paymentKey=...`)
3. ✅ Card payment works
4. ✅ Wallet payment works
5. ✅ Webhook receives payments (`/api/paymob/webhook`)
6. ✅ Orders update to `PAID` status after successful payment
7. ✅ Odoo sync triggers for paid orders

## 🆘 Troubleshooting

### Payment Gateway Not Configured
- Check all required env vars are set
- Verify `PAYMOB_ENVIRONMENT=production`
- Check Vercel/GitHub logs for missing variables

### Iframe Not Loading
- Verify `NEXT_PUBLIC_PAYMOB_IFRAME_ID=983628`
- Check browser console for CORS/iframe errors
- Ensure payment key is valid (1-hour expiration)

### Webhook Not Working
- Verify `PAYMOB_HMAC_SECRET` matches Paymob dashboard
- Check webhook URL in Paymob dashboard: `https://your-domain.com/api/paymob/webhook`
- Review server logs for HMAC verification errors

## 📚 Related Documentation

- [Payment Service Implementation](../src/server/services/paymob/paymentService.ts)
- [Paymob Client Configuration](../src/server/services/paymob/paymobClient.ts)
- [Payment UI Component](../src/app/payment/process/page.tsx)
- [Environment Variables Example](./ENV_EXAMPLE.md)
