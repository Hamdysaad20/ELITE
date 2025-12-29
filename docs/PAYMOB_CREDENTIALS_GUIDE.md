# Paymob Credentials Guide - Where to Find Everything

## Overview

This guide helps you locate all required Paymob credentials in the dashboard. If you can't find something, contact Paymob support.

## Required Credentials

### 1. API Key, Secret Key, Public Key

**Location**: Paymob Dashboard → Settings → Account Info

**Steps**:
1. Log in to [Paymob Dashboard](https://accept.paymob.com/)
2. Click on **Settings** in the sidebar
3. Select **Account Info**
4. You'll see:
   - **API Key** (for server-side authentication)
   - **Secret Key** (for webhook verification)
   - **Public Key** (for frontend SDK)

**Important**: 
- Make sure you're in **TEST** mode (top panel) for sandbox credentials
- Switch to **LIVE** mode for production credentials

### 2. Integration ID (iFrame ID)

**Location**: Paymob Dashboard → Developers → iFrames

**Steps**:
1. Go to **Developers** section in the sidebar
2. Click on **iFrames** (NOT "Payment Integrations")
3. You'll see a list of your iFrames
4. The **iFrame ID** is your **Integration ID**

**If you don't see any iFrames**:
- You may need to create one first
- Or contact Paymob support to get your Integration ID
- Some accounts have Integration IDs provided during setup

**Alternative Locations to Check**:
- **Developers** → **Payment Integrations** (older dashboard versions)
- **Settings** → **Integrations**
- Contact Paymob support if not found

### 3. HMAC Secret

**Location**: Paymob Dashboard → Settings → Account Info OR Developers → Webhooks

**Steps**:
1. Option 1: **Settings** → **Account Info** → Look for "HMAC Secret"
2. Option 2: **Developers** → **Webhooks** → HMAC Secret is displayed here

**Important**: 
- This is used to verify webhook authenticity
- Keep it secret and never expose it in client-side code

### 4. Wallet Integration ID (Optional)

**Location**: Same as Integration ID

**Steps**:
1. Go to **Developers** → **iFrames**
2. Look for a separate iFrame configured for wallets
3. If you have multiple payment methods, you may have separate Integration IDs for:
   - Cards
   - Wallets (Vodafone Cash, Orange Money, etc.)
   - Installments
   - Fawry

**Note**: If you only have one Integration ID, you can use it for all payment methods.

## Environment Variables Setup

Once you have all credentials, add them to your `.env.local` file:

```bash
# Required
PAYMOB_API_KEY=your_api_key_here
PAYMOB_SECRET_KEY=your_secret_key_here
PAYMOB_PUBLIC_KEY=your_public_key_here
PAYMOB_HMAC_SECRET=your_hmac_secret_here
PAYMOB_INTEGRATION_ID=your_integration_id_here

# Optional
PAYMOB_WALLET_INTEGRATION_ID=your_wallet_integration_id_here
PAYMOB_ENVIRONMENT=sandbox  # or 'production'
```

## Troubleshooting

### Can't Find Integration ID

**Solution 1**: Check iFrames section
- Go to **Developers** → **iFrames**
- If empty, you may need to create an iFrame first

**Solution 2**: Contact Paymob Support
- Email: support@paymob.com
- Phone: +959972790066
- Available 24/7

**Solution 3**: Check Account Status
- Ensure your account is fully activated
- Verify you have the correct permissions
- Some features require account verification

### Can't Find HMAC Secret

**Solution**: 
- Check **Settings** → **Account Info**
- Check **Developers** → **Webhooks**
- If not visible, contact Paymob support to enable webhooks

### Test vs Live Credentials

**Important**: 
- **TEST** mode credentials are for sandbox/testing
- **LIVE** mode credentials are for production
- Make sure you're using the correct set based on `PAYMOB_ENVIRONMENT`

## Verification

After adding credentials, verify them:

```bash
# Check if variables are loaded
npx tsx scripts/check-paymob-env.ts

# Run full integration test
npx tsx scripts/test-paymob-integration.ts
```

## Support

If you still can't find your credentials:

1. **Paymob Support**:
   - Email: support@paymob.com
   - Phone: +959972790066
   - Available 24/7

2. **Dashboard Help**:
   - Look for "Help" or "?" icon in dashboard
   - Check Paymob documentation: https://developers.paymob.com/

3. **Account Manager**:
   - If you have an account manager, contact them directly
   - They can provide all credentials and setup assistance

## Common Issues

### "Integration ID not found"
- Check **iFrames** section, not "Payment Integrations"
- May need to create iFrame first
- Contact support if account is new

### "HMAC Secret missing"
- Check both **Settings** → **Account Info** and **Developers** → **Webhooks**
- May need to enable webhooks first
- Contact support to activate webhook features

### "Credentials don't work"
- Verify you're using TEST credentials for sandbox
- Check for typos in environment variables
- Ensure credentials match the environment (test/live)

