# Paymob Webhook Configuration Guide

## Webhook URLs to Configure

In your Paymob Dashboard, navigate to **Developers** > **Webhooks** and configure the following URLs:

### Production Environment
- **Transaction Processed Callback URL**: 
  ```
  https://yourdomain.com/api/payments/webhook
  ```
- **Transaction Response Callback URL**: 
  ```
  https://yourdomain.com/api/payments/webhook
  ```

### Development/Staging Environment
- **Transaction Processed Callback URL**: 
  ```
  https://your-staging-domain.com/api/payments/webhook
  ```
- **Transaction Response Callback URL**: 
  ```
  https://your-staging-domain.com/api/payments/webhook
  ```

## Steps to Configure

1. **Log in to Paymob Dashboard**
   - Go to https://accept.paymob.com/
   - Log in with your merchant account

2. **Navigate to Webhooks Section**
   - Option 1: Go to **Settings** → **Account Info** → Look for Webhooks section
   - Option 2: Go to **Developers** → **Webhooks** tab
   - If you don't see Webhooks, contact Paymob support to enable this feature

3. **Add Webhook URLs**
   - Enter the webhook URL in the **Transaction Processed Callback URL** field
   - Enter the same URL in the **Transaction Response Callback URL** field
   - Click **Save** or **Update**

4. **Verify HMAC Secret**
   - In the same section, locate your **HMAC Secret**
   - Copy this value and ensure it matches your `PAYMOB_HMAC_SECRET` environment variable
   - The HMAC secret is used to verify webhook authenticity

5. **Test Webhook (Optional)**
   - Paymob provides a test webhook feature
   - Use it to verify your webhook endpoint is receiving requests correctly

## Webhook Security

The webhook handler automatically verifies HMAC signatures using the following process:

1. Paymob sends webhook with HMAC signature in the payload
2. Our handler calculates HMAC using: `SHA512(amount_cents + created_at + HMAC_SECRET)`
3. Compares calculated HMAC with received HMAC
4. Only processes webhook if signatures match

## Troubleshooting

### Webhook Not Received
- Verify the URL is publicly accessible (not localhost)
- Check that the URL is correct (no typos)
- Ensure your server is running and accessible
- Check server logs for incoming requests

### HMAC Verification Failing
- Verify `PAYMOB_HMAC_SECRET` matches the value in Paymob dashboard
- Check that the HMAC secret hasn't been regenerated
- Review webhook payload structure in logs

### Webhook Processing Errors
- Check server logs for detailed error messages
- Verify database connection is working
- Ensure order exists in database (check `merchant_order_id`)

## Testing Webhooks Locally

For local development, use a tunneling service like:
- **ngrok**: `ngrok http 3000`
- **localtunnel**: `npx localtunnel --port 3000`

Then use the tunnel URL in Paymob dashboard:
```
https://your-ngrok-url.ngrok.io/api/payments/webhook
```

## Monitoring

Monitor webhook activity through:
- Server logs (check for `[Paymob Webhook]` messages)
- Database `PaymentTransaction` table
- Paymob dashboard transaction history

