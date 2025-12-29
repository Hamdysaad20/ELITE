/**
 * Paymob API Client
 * Handles authentication and API calls to Paymob payment gateway
 */

import axios, { AxiosInstance } from "axios";
import crypto from "node:crypto";
import type {
  PaymobAuthRequest,
  PaymobAuthResponse,
  PaymobOrderRequest,
  PaymobOrderResponse,
  PaymobPaymentKeyRequest,
  PaymobPaymentKeyResponse,
  PaymobTransactionResponse,
  PaymobBillingData,
} from "@/types/payments";

export interface PaymobConfig {
  apiKey: string;
  secretKey: string;
  publicKey: string;
  integrationId: number; // Default integration ID for cards
  walletIntegrationId?: number; // Integration ID for wallets
  hmacSecret: string;
  environment: "sandbox" | "production";
}

const PAYMOB_BASE_URL = {
  sandbox: "https://accept.paymob.com/api",
  production: "https://accept.paymob.com/api",
};

export class PaymobClient {
  private config: PaymobConfig;
  private axios: AxiosInstance;
  private authToken: string | null = null;
  private authTokenExpiry: number = 0;
  private readonly TOKEN_CACHE_MS = 55 * 60 * 1000; // 55 minutes (tokens expire in 1 hour)

  constructor(config: PaymobConfig) {
    this.config = config;
    const baseURL = PAYMOB_BASE_URL[config.environment];
    
    this.axios = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Authenticate with Paymob API and get auth token
   * Tokens are cached for 55 minutes
   */
  private async authenticate(): Promise<string> {
    const now = Date.now();
    
    // Return cached token if still valid
    if (this.authToken && now < this.authTokenExpiry) {
      return this.authToken;
    }

    try {
      const payload: PaymobAuthRequest = {
        api_key: this.config.apiKey,
      };

      const response = await this.axios.post<PaymobAuthResponse>(
        "/auth/tokens",
        payload
      );

      if (!response.data?.token) {
        throw new Error("Failed to authenticate with Paymob: No token received");
      }

      this.authToken = response.data.token;
      this.authTokenExpiry = now + this.TOKEN_CACHE_MS;

      return this.authToken;
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail || 
                      (error as { message?: string })?.message || 
                      "Paymob authentication failed";
      throw new Error(`Paymob authentication error: ${message}`);
    }
  }

  /**
   * Create an order in Paymob
   */
  async createOrder(
    amountCents: number,
    items: Array<{ name: string; amount_cents: number; description?: string; quantity: number }>,
    merchantOrderId: string,
    deliveryNeeded: boolean = false
  ): Promise<PaymobOrderResponse> {
    try {
      const authToken = await this.authenticate();

      const payload: PaymobOrderRequest = {
        auth_token: authToken,
        delivery_needed: deliveryNeeded,
        amount_cents: amountCents,
        currency: "EGP",
        items,
      };

      const response = await this.axios.post<PaymobOrderResponse>(
        "/ecommerce/orders",
        payload
      );

      if (!response.data?.id) {
        throw new Error("Failed to create Paymob order: No order ID received");
      }

      return response.data;
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail || 
                      (error as { message?: string })?.message || 
                      "Failed to create Paymob order";
      throw new Error(`Paymob order creation error: ${message}`);
    }
  }

  /**
   * Get payment key for frontend
   */
  async getPaymentKey(
    orderId: number,
    amountCents: number,
    billingData: PaymobBillingData,
    integrationId?: number
  ): Promise<string> {
    try {
      const authToken = await this.authenticate();

      // Use provided integration ID or default
      const integrationIdToUse = integrationId || this.config.integrationId;

      const payload: PaymobPaymentKeyRequest = {
        auth_token: authToken,
        amount_cents: amountCents,
        expiration: 3600, // 1 hour
        order_id: orderId,
        billing_data: billingData,
        currency: "EGP",
        integration_id: integrationIdToUse,
        lock_order_when_paid: true,
      };

      const response = await this.axios.post<PaymobPaymentKeyResponse>(
        "/acceptance/payment_keys",
        payload
      );

      if (!response.data?.token) {
        throw new Error("Failed to get payment key: No token received");
      }

      return response.data.token;
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail || 
                      (error as { message?: string })?.message || 
                      "Failed to get payment key";
      throw new Error(`Paymob payment key error: ${message}`);
    }
  }

  /**
   * Retrieve transaction details
   */
  async retrieveTransaction(transactionId: number): Promise<PaymobTransactionResponse> {
    try {
      const authToken = await this.authenticate();

      const response = await this.axios.get<PaymobTransactionResponse>(
        `/acceptance/transactions/${transactionId}`,
        {
          params: {
            token: authToken,
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail || 
                      (error as { message?: string })?.message || 
                      "Failed to retrieve transaction";
      throw new Error(`Paymob transaction retrieval error: ${message}`);
    }
  }

  /**
   * Verify HMAC signature from webhook
   */
  verifyWebhookSignature(amountCents: number, created_at: string, hmac: string): boolean {
    try {
      const hmacString = `${amountCents}${created_at}${this.config.hmacSecret}`;
      const calculatedHmac = crypto
        .createHash("sha512")
        .update(hmacString)
        .digest("hex");

      return calculatedHmac === hmac;
    } catch (error) {
      console.error("[Paymob] HMAC verification error:", error);
      return false;
    }
  }

  /**
   * Get integration ID based on payment method
   * 
   * Note: If walletIntegrationId is not configured, the default integrationId
   * will be used for all payment methods including wallets.
   */
  getIntegrationId(paymentMethod: string): number {
    if (paymentMethod === "wallet" && this.config.walletIntegrationId) {
      return this.config.walletIntegrationId;
    }
    // Use default integration ID for all payment methods if wallet-specific ID not set
    return this.config.integrationId;
  }

  /**
   * Get public key for frontend SDK
   */
  getPublicKey(): string {
    return this.config.publicKey;
  }
}

/**
 * Create Paymob client from environment variables
 */
export function createPaymobClient(): PaymobClient | null {
  const apiKey = process.env.PAYMOB_API_KEY;
  const secretKey = process.env.PAYMOB_SECRET_KEY;
  const publicKey = process.env.PAYMOB_PUBLIC_KEY;
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
  const integrationId = process.env.PAYMOB_INTEGRATION_ID;
  const walletIntegrationId = process.env.PAYMOB_WALLET_INTEGRATION_ID;
  const environment = (process.env.PAYMOB_ENVIRONMENT || "sandbox") as "sandbox" | "production";

  if (!apiKey || !secretKey || !publicKey || !hmacSecret || !integrationId) {
    console.warn("[Paymob] Missing required environment variables");
    return null;
  }

  const integrationIdNum = parseInt(integrationId, 10);
  if (isNaN(integrationIdNum)) {
    console.warn("[Paymob] Invalid PAYMOB_INTEGRATION_ID");
    return null;
  }

  const config: PaymobConfig = {
    apiKey,
    secretKey,
    publicKey,
    integrationId: integrationIdNum,
    walletIntegrationId: walletIntegrationId ? parseInt(walletIntegrationId, 10) : undefined,
    hmacSecret,
    environment,
  };

  return new PaymobClient(config);
}

/**
 * Check if Paymob is configured
 */
export function isPaymobConfigured(): boolean {
  return !!(
    process.env.PAYMOB_API_KEY &&
    process.env.PAYMOB_SECRET_KEY &&
    process.env.PAYMOB_PUBLIC_KEY &&
    process.env.PAYMOB_HMAC_SECRET &&
    process.env.PAYMOB_INTEGRATION_ID
  );
}

