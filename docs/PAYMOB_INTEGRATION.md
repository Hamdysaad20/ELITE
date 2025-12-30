# Paymob Payment Gateway Integration

This document describes the Paymob payment gateway integration for the ELITE Coffee Shop platform.

## Overview

The integration uses Paymob's Direct API Integration to support multiple payment methods:
- Credit/Debit Cards
- Mobile Wallets (Vodafone Cash, Orange Money, etc.)
- Installments
- Fawry

## Architecture

The payment flow follows this sequence:

1. **Order Creation**: Order is created with `paymentStatus: PENDING`
2. **Payment Intent**: Payment intent is created in Paymob, returning a payment key
3. **Frontend Payment**: User completes payment using Paymob SDK
4. **Webhook**: Paymob sends webhook notification with payment result
5. **Order Update**: Order status updated to `PAID` or `FAILED`
6. **Downstream Actions**: Odoo sync and loyalty points awarded after payment confirmation

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Paymob API Credentials
PAYMOB_API_KEY=your_api_key_here
PAYMOB_SECRET_KEY=your_secret_key_here
PAYMOB_PUBLIC_KEY=your_public_key_here

# Paymob Integration IDs
PAYMOB_INTEGRATION_ID=123456  # Integration ID for cards
PAYMOB_WALLET_INTEGRATION_ID=789012  # Optional: Integration ID for wallets

# Webhook Security
PAYMOB_HMAC_SECRET=your_hmac_secret_here

# Environment
PAYMOB_ENVIRONMENT=sandbox  # or 'production'
```

### Getting Your Credentials

1. **API Key, Secret Key, Public Key**: 
   - Log in to [Paymob Dashboard](https://accept.paymob.com/)
   - Go to **Settings** → **Account Info**
   - You'll find your API Key here
   - Ensure you're in **TEST** mode for sandbox credentials

2. **Integration ID** (also called iFrame ID):
   - In Paymob Dashboard, go to **Developers** section
   - Click on **iFrames** (not Payment Integrations)
   - Your iFrame ID is listed here - this is your Integration ID
   - **Note**: For Direct API Integration, you may need to create an iFrame first or contact Paymob support to get your Integration ID

3. **HMAC Secret**:
   - In Paymob Dashboard, go to **Settings** → **Account Info**
   - Or go to **Developers** → **Webhooks**
   - Your HMAC Secret is displayed here

**Important**: If you cannot find Integration ID in the dashboard:
- Contact Paymob support at support@paymob.com
- Integration IDs are sometimes provided during account setup
- You may need to create a payment integration/iFrame first to generate an ID

## Webhook Configuration

Configure the following webhook URLs in your Paymob Dashboard:

- **Transaction Processed Callback URL**: `https://yourdomain.com/api/payments/webhook`
- **Transaction Response Callback URL**: `https://yourdomain.com/api/payments/webhook`

## API Endpoints

### POST /api/payments/create
Creates a payment intent for an order.

**Request:**
```json
{
  "orderId": "uuid",
  "paymentMethod": "card" | "wallet",
  "integrationId": 123456  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentKey": "token_from_paymob",
    "transactionId": "internal_transaction_id",
    "orderId": "uuid",
    "amount": 150.00,
    "currency": "EGP"
  }
}
```

### POST /api/payments/webhook
Receives webhook notifications from Paymob. This endpoint:
- Verifies HMAC signature
- Updates order payment status
- Triggers Odoo sync (if payment successful)
- Awards loyalty points (if order completed)

### GET /api/payments/status/[orderId]
Gets payment status for an order.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "pending" | "success" | "failed" | "cancelled" | "refunded",
    "paymobTransactionId": "123456",
    "amount": 150.00,
    "paidAt": "2024-01-01T00:00:00Z" | null,
    "error": null
  }
}
```

## Database Schema

### PaymentTransaction Model
Tracks all payment attempts and their status:
- `paymobTransactionId`: Paymob's transaction ID
- `paymentKey`: Temporary payment key (expires)
- `status`: Payment status
- `amount`: Transaction amount
- `webhookReceived`: Whether webhook was received
- `webhookPayload`: Full webhook payload for debugging

### Order Model Updates
- `paymobTransactionId`: Paymob transaction ID
- `paymobPaymentKey`: Temporary payment key for frontend
- `paymentIntentId`: Internal payment intent ID

## Security

1. **HMAC Verification**: All webhooks are verified using HMAC signature
2. **PCI Compliance**: No card data is stored (handled by Paymob)
3. **Idempotency**: Payment requests use unique order IDs
4. **Error Handling**: Comprehensive error handling with user-friendly messages
5. **Rate Limiting**: Redis-based rate limiting protects payment endpoints (5 requests/minute for payment creation)
6. **Request Timeouts**: All payment operations have timeouts (20s for payment creation, 10s for status checks)
7. **Analytics Tracking**: All payment events are tracked for monitoring and debugging

## Payment Flow Integration

### Order Creation
When an order is created with online payment method:
1. Order is created with `paymentStatus: PENDING`
2. Payment intent is automatically created (if Paymob is configured)
3. Payment key is returned in response
4. Odoo sync is **deferred** until payment is confirmed

### Payment Processing
1. Frontend receives payment key
2. User completes payment via Paymob SDK
3. Paymob sends webhook notification
4. Webhook handler updates order status
5. Odoo sync and loyalty points are triggered

### Cash Payments (COD)
- Orders with `paymentMethod: CASH` sync to Odoo immediately
- No payment intent creation needed
- Loyalty points awarded after delivery/completion

## Testing

Use Paymob's sandbox environment for testing:
- Set `PAYMOB_ENVIRONMENT=sandbox`
- Use sandbox API credentials
- Test cards: Available in Paymob dashboard

## Troubleshooting

### Payment Intent Creation Fails
- Check API key is correct
- Verify integration ID is valid
- Check order exists and belongs to user
- Ensure order payment status is PENDING

### Webhook Not Received
- Verify webhook URL is configured in Paymob dashboard
- Check webhook URL is publicly accessible
- Verify HMAC secret matches Paymob dashboard
- Check server logs for webhook errors

### Payment Status Not Updating
- Check webhook is being received (logs)
- Verify HMAC signature is valid
- Check order exists in database
- Review payment transaction records

## Monitoring

Monitor payment transactions via:
- PaymentTransaction model in database
- Webhook logs in server console
- Order payment status updates
- Paymob dashboard transaction history
- Analytics events (payment_intent_created, payment_intent_failed, webhook_processed_successfully, etc.)
- Performance monitoring (slow request detection)
- Rate limit tracking (payment_intent_rate_limited events)

### Analytics Events

The following payment events are tracked:
- `payment_intent_created` - Payment intent successfully created
- `payment_intent_failed` - Payment intent creation failed
- `payment_intent_rate_limited` - Rate limit exceeded
- `payment_status_checked` - Payment status queried
- `payment_status_failed` - Status check failed
- `webhook_processed_successfully` - Webhook processed successfully
- `webhook_processing_failed` - Webhook processing failed
- `payment_iframe_ready` - Payment iframe loaded
- `payment_iframe_error` - Payment iframe error
- `payment_iframe_closed` - User closed payment window

See `docs/PRODUCTION_IMPROVEMENTS.md` for more details on analytics tracking.

