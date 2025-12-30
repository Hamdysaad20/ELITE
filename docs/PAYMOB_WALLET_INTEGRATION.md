# Paymob Wallet Integration ID - Optional Configuration

## Is PAYMOB_WALLET_INTEGRATION_ID Required?

**No, it's optional!** 

If you don't have a separate wallet integration ID, you can skip this environment variable. The system will automatically use your default `PAYMOB_INTEGRATION_ID` for all payment methods, including wallets.

## How It Works

The Paymob integration supports two scenarios:

### Scenario 1: Single Integration ID (Recommended for Most Cases)

If you have one Integration ID that handles all payment methods (cards, wallets, etc.):

```bash
# .env.local
PAYMOB_INTEGRATION_ID=123456  # This will be used for ALL payment methods
# PAYMOB_WALLET_INTEGRATION_ID is NOT needed - leave it out
```

**Result**: 
- Cards → Uses `PAYMOB_INTEGRATION_ID`
- Wallets → Uses `PAYMOB_INTEGRATION_ID` (same one)
- All payment methods use the same integration

### Scenario 2: Separate Wallet Integration ID

If Paymob has provided you with a separate Integration ID specifically for wallets:

```bash
# .env.local
PAYMOB_INTEGRATION_ID=123456      # For cards
PAYMOB_WALLET_INTEGRATION_ID=789012  # For wallets only
```

**Result**:
- Cards → Uses `PAYMOB_INTEGRATION_ID`
- Wallets → Uses `PAYMOB_WALLET_INTEGRATION_ID`

## How to Check If You Need a Separate Wallet ID

1. **Check with Paymob Support**:
   - Ask if your Integration ID supports all payment methods
   - Most accounts have one Integration ID that handles everything

2. **Test It**:
   - Try making a wallet payment with just `PAYMOB_INTEGRATION_ID`
   - If it works, you don't need a separate wallet ID

3. **Check Your Paymob Dashboard**:
   - Go to **Developers** → **iFrames**
   - If you see multiple iFrames, one might be for wallets
   - If you only see one, use that for everything

## Current Configuration

Based on your setup, you can simply use:

```bash
# Required
PAYMOB_API_KEY=your_api_key
PAYMOB_SECRET_KEY=your_secret_key
PAYMOB_PUBLIC_KEY=your_public_key
PAYMOB_HMAC_SECRET=your_hmac_secret
PAYMOB_INTEGRATION_ID=your_integration_id

# Optional - Only if Paymob gave you a separate wallet ID
# PAYMOB_WALLET_INTEGRATION_ID=leave_this_out_if_not_provided

# Optional
PAYMOB_ENVIRONMENT=sandbox
```

## Code Behavior

The integration automatically handles this:

```typescript
// In paymobClient.ts
getIntegrationId(paymentMethod: string): number {
  if (paymentMethod === "wallet" && this.config.walletIntegrationId) {
    return this.config.walletIntegrationId;  // Use wallet-specific ID if set
  }
  return this.config.integrationId;  // Otherwise use default for everything
}
```

**This means**:
- If `PAYMOB_WALLET_INTEGRATION_ID` is not set → wallets use `PAYMOB_INTEGRATION_ID`
- If `PAYMOB_WALLET_INTEGRATION_ID` is set → wallets use the wallet-specific ID

## Testing Without Wallet Integration ID

You can test the integration right now with just the default Integration ID:

1. **Add to .env.local** (without wallet ID):
   ```bash
   PAYMOB_INTEGRATION_ID=your_iframe_id
   # Don't add PAYMOB_WALLET_INTEGRATION_ID
   ```

2. **Run test**:
   ```bash
   npx tsx scripts/test-paymob-integration.ts
   ```

3. **Test wallet payment**:
   - Create an order with wallet payment method
   - It will use your default Integration ID
   - If it works, you're all set!

## When You Might Need a Separate Wallet ID

You only need `PAYMOB_WALLET_INTEGRATION_ID` if:

1. **Paymob explicitly told you** to use a different ID for wallets
2. **Your default Integration ID doesn't support wallets** (rare)
3. **You have separate integrations** for different payment methods

## Summary

✅ **You can skip `PAYMOB_WALLET_INTEGRATION_ID`** - it's completely optional

✅ **Use your default `PAYMOB_INTEGRATION_ID` for everything** - this works for most accounts

✅ **The code automatically handles this** - if wallet ID is not set, it uses the default

If you're unsure, just use your main Integration ID for all payment methods. If Paymob support later tells you that you need a separate wallet ID, you can add it then.

