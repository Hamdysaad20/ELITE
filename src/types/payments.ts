/**
 * Payment-related types for Paymob integration
 */

export enum PaymentTransactionStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export enum PaymobPaymentMethod {
  CARD = "card",
  WALLET = "wallet",
  INSTALLMENTS = "installments",
  FAWRY = "fawry",
}

// Map PaymentMethod enum to PaymobPaymentMethod
export function mapPaymentMethodToPaymob(method: string): PaymobPaymentMethod {
  switch (method) {
    case "CARD":
      return PaymobPaymentMethod.CARD;
    case "WALLET":
      return PaymobPaymentMethod.WALLET;
    case "FAWRY":
      return PaymobPaymentMethod.FAWRY;
    default:
      return PaymobPaymentMethod.CARD;
  }
}

/**
 * Paymob API Request/Response Types
 */
export interface PaymobAuthRequest {
  api_key: string;
}

export interface PaymobAuthResponse {
  token: string;
}

export interface PaymobOrderRequest {
  auth_token: string;
  delivery_needed: boolean;
  amount_cents: number;
  currency: string;
  items: PaymobOrderItem[];
}

export interface PaymobOrderItem {
  name: string;
  amount_cents: number;
  description?: string;
  quantity: number;
}

export interface PaymobOrderResponse {
  id: number;
  delivery_needed: boolean;
  amount_cents: number;
  currency: string;
  is_payment_locked: boolean;
  merchant_order_id: string;
  wallet_notification: unknown;
  paid_amount_cents: number;
  notify_user_with_email: boolean;
  items: PaymobOrderItem[];
  order_url: string;
  commission_fees: number;
  delivery_fees_cents: number;
  merchant: {
    id: number;
    created_at: string;
    phones: string[];
    company_emails: string[];
    company_name: string;
    state: string;
    country: string;
    city: string;
    postal_code: string;
    street: string;
  };
  shipping_data: unknown;
  shipping_details: unknown;
  is_cancel: boolean;
  is_return: boolean;
  is_returned: boolean;
  is_canceled: boolean;
  token: string;
  total_amount: number;
}

export interface PaymobPaymentKeyRequest {
  auth_token: string;
  amount_cents: number;
  expiration: number;
  order_id: number;
  billing_data: PaymobBillingData;
  currency: string;
  integration_id: number;
  lock_order_when_paid: boolean;
}

export interface PaymobBillingData {
  apartment: string;
  email: string;
  floor: string;
  first_name: string;
  street: string;
  building: string;
  phone_number: string;
  shipping_method: string;
  postal_code: string;
  city: string;
  country: string;
  last_name: string;
  state: string;
}

export interface PaymobPaymentKeyResponse {
  token: string;
}

export interface PaymobTransactionResponse {
  id: number;
  pending: boolean;
  amount_cents: number;
  success: boolean;
  is_auth: boolean;
  is_capture: boolean;
  is_standalone_refund: boolean;
  is_voided: boolean;
  is_refunded: boolean;
  is_3d_secure: boolean;
  integration_id: number;
  profile_id: number;
  has_parent_transaction: boolean;
  order: {
    id: number;
    created_at: string;
    delivery_needed: boolean;
    merchant: {
      id: number;
    };
    amount_cents: number;
    currency: string;
    merchant_order_id: string;
  };
  created_at: string;
  currency: string;
  merchant_order_id: string;
  wallet_notification: unknown;
  paid_amount_cents: number;
  notify_user_with_email: boolean;
  items: PaymobOrderItem[];
  shipping_data: unknown;
  shipping_details: unknown;
  transaction_processed_callback_responses: unknown[];
  source_data: {
    type: string;
    pan: string;
    sub_type: string;
  };
  api_source: string;
  url: string;
}

/**
 * Webhook payload from Paymob
 */
export interface PaymobWebhookPayload {
  obj: {
    id: number;
    pending: boolean;
    amount_cents: number;
    success: boolean;
    is_auth: boolean;
    is_capture: boolean;
    is_standalone_refund: boolean;
    is_voided: boolean;
    is_refunded: boolean;
    is_3d_secure: boolean;
    integration_id: number;
    profile_id: number;
    has_parent_transaction: boolean;
    order: {
      id: number;
      created_at: string;
      delivery_needed: boolean;
      merchant: {
        id: number;
      };
      amount_cents: number;
      currency: string;
      merchant_order_id: string;
    };
    created_at: string;
    currency: string;
    merchant_order_id: string;
    data: {
      message: string;
    };
    source_data: {
      type: string;
      pan: string;
      sub_type: string;
    };
    api_source: string;
    url: string;
  };
  type: string;
  hmac?: string;
}

/**
 * Payment Intent creation request
 */
export interface CreatePaymentIntentRequest {
  orderId: string;
  paymentMethod: PaymobPaymentMethod;
  integrationId?: number; // Optional, will use default if not provided
}

export interface CreatePaymentIntentResponse {
  paymentKey: string;
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
}

/**
 * Payment status response
 */
export interface PaymentStatusResponse {
  orderId: string;
  status: PaymentTransactionStatus;
  paymobTransactionId: string | null;
  amount: number;
  paidAt: string | null;
  error: string | null;
}
