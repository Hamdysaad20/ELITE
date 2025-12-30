# Paymob Integration Quick Start

## Step 1: Get Your Credentials

### From Paymob Dashboard (https://accept.paymob.com/)

1. **API Key, Secret Key, Public Key**
   - Go to **Settings** → **Account Info**
   - Copy all three keys
   - Make sure you're in **TEST** mode for sandbox

2. **Integration ID (iFrame ID)**
   - Go to **Developers** → **iFrames**
   - Copy the iFrame ID (this is your Integration ID)
   - **If you don't see iFrames**: Contact Paymob support or check if you need to create one first

3. **HMAC Secret**
   - Go to **Settings** → **Account Info** OR **Developers** → **Webhooks**
   - Copy the HMAC Secret

## Step 2: Add to .env.local

```bash
PAYMOB_API_KEY=your_api_key
PAYMOB_SECRET_KEY=your_secret_key
PAYMOB_PUBLIC_KEY=your_public_key
PAYMOB_HMAC_SECRET=your_hmac_secret
PAYMOB_INTEGRATION_ID=your_iframe_id
PAYMOB_ENVIRONMENT=sandbox
```

## Step 3: Verify

```bash
npx tsx scripts/check-paymob-env.ts
npx tsx scripts/test-paymob-integration.ts
```

## Step 4: Configure Webhooks

1. Get your webhook URL (production or ngrok for local)
2. Go to Paymob Dashboard → **Developers** → **Webhooks**
3. Set both callback URLs to: `https://yourdomain.com/api/payments/webhook`
4. Save

## Step 5: Test

1. Start server: `npm run dev`
2. Create test order with Card/Wallet payment
3. Use test card: `4987654321098769` (sandbox)

## Need Help?

- **Can't find Integration ID?** → Check **Developers** → **iFrames** (not Payment Integrations)
- **Still can't find it?** → Contact Paymob support: support@paymob.com
- **See**: `docs/PAYMOB_CREDENTIALS_GUIDE.md` for detailed help
