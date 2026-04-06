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
  subscriptionIntegrationId?: number; // Subscription integration
  hostIntegrationId?: number; // Host integration
  balanceTransferIntegrationId?: number; // Balance transfer
  cashCollectionIntegrationId?: number; // Cash collection / deposit
  billPaymentIntegrationId?: number; // Bill payment
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
  private readonly MAX_RETRY_ATTEMPTS = 3;

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

  private isRetriableError(error: unknown): boolean {
    const responseStatus =
      (
        error as {
          response?: { status?: number };
        }
      )?.response?.status ?? 0;
    const code = (error as { code?: string })?.code;

    if (responseStatus === 429 || responseStatus >= 500) {
      return true;
    }

    return (
      code === "ETIMEDOUT" ||
      code === "ECONNABORTED" ||
      code === "ECONNRESET" ||
      code === "ECONNREFUSED" ||
      code === "EAI_AGAIN" ||
      code === "ENOTFOUND"
    );
  }

  private isUnauthorizedError(error: unknown): boolean {
    return (
      (
        error as {
          response?: { status?: number };
        }
      )?.response?.status === 401
    );
  }

  private getRetryDelayMs(attempt: number): number {
    const baseDelay = 500;
    const maxDelay = 4000;
    const jitter = Math.floor(Math.random() * 250);
    return Math.min(baseDelay * 2 ** (attempt - 1), maxDelay) + jitter;
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (
          !this.isRetriableError(error) ||
          attempt === this.MAX_RETRY_ATTEMPTS
        ) {
          throw error;
        }

        const delayMs = this.getRetryDelayMs(attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw lastError;
  }

  private async executeWithAuthRetry<T>(
    request: (authToken: string) => Promise<T>,
  ): Promise<T> {
    let authToken = await this.authenticate();

    try {
      return await request(authToken);
    } catch (error) {
      if (!this.isUnauthorizedError(error)) {
        throw error;
      }

      // Refresh token once on auth failures and retry.
      this.authToken = null;
      this.authTokenExpiry = 0;
      authToken = await this.authenticate();
      return request(authToken);
    }
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

      const response = await this.withRetry(() =>
        this.axios.post<PaymobAuthResponse>("/auth/tokens", payload),
      );

      if (!response.data?.token) {
        throw new Error(
          "Failed to authenticate with Paymob: No token received",
        );
      }

      this.authToken = response.data.token;
      this.authTokenExpiry = now + this.TOKEN_CACHE_MS;

      return this.authToken;
    } catch (error: unknown) {
      const message =
        (
          error as {
            response?: { data?: { detail?: string } };
            message?: string;
          }
        )?.response?.data?.detail ||
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
    items: Array<{
      name: string;
      amount_cents: number;
      description?: string;
      quantity: number;
    }>,
    merchantOrderId: string,
    deliveryNeeded: boolean = false,
  ): Promise<PaymobOrderResponse> {
    try {
      const response = await this.withRetry(() =>
        this.executeWithAuthRetry((authToken) => {
          const payload: PaymobOrderRequest = {
            auth_token: authToken,
            delivery_needed: deliveryNeeded,
            amount_cents: amountCents,
            currency: "EGP",
            items,
            merchant_order_id: merchantOrderId,
          };

          return this.axios.post<PaymobOrderResponse>(
            "/ecommerce/orders",
            payload,
          );
        }),
      );

      if (!response.data?.id) {
        throw new Error("Failed to create Paymob order: No order ID received");
      }

      return response.data;
    } catch (error: unknown) {
      const resp = (error as { response?: { status?: number; data?: unknown } })
        ?.response;
      const message =
        (resp as { data?: { detail?: string; message?: string } })?.data
          ?.detail ||
        (resp as { data?: { message?: string } })?.data?.message ||
        (error as { message?: string })?.message ||
        "Failed to create Paymob order";
      const details =
        resp?.data && typeof resp.data !== "string"
          ? JSON.stringify(resp.data)
          : resp?.data
            ? String(resp.data)
            : undefined;
      throw new Error(
        `Paymob order creation error: ${message}${resp?.status ? ` (HTTP ${resp.status})` : ""}${details ? ` :: ${details}` : ""}`,
      );
    }
  }

  /**
   * Get payment key for frontend
   */
  async getPaymentKey(
    orderId: number,
    amountCents: number,
    billingData: PaymobBillingData,
    integrationId?: number,
  ): Promise<string> {
    try {
      // Use provided integration ID or default
      const integrationIdToUse = integrationId || this.config.integrationId;

      const response = await this.withRetry(() =>
        this.executeWithAuthRetry((authToken) => {
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

          return this.axios.post<PaymobPaymentKeyResponse>(
            "/acceptance/payment_keys",
            payload,
          );
        }),
      );

      if (!response.data?.token) {
        throw new Error("Failed to get payment key: No token received");
      }

      return response.data.token;
    } catch (error: unknown) {
      const resp = (error as { response?: { status?: number; data?: unknown } })
        ?.response;
      const message =
        (resp as { data?: { detail?: string; message?: string } })?.data
          ?.detail ||
        (resp as { data?: { message?: string } })?.data?.message ||
        (error as { message?: string })?.message ||
        "Failed to get payment key";
      const details =
        resp?.data && typeof resp.data !== "string"
          ? JSON.stringify(resp.data)
          : resp?.data
            ? String(resp.data)
            : undefined;
      throw new Error(
        `Paymob payment key error: ${message}${resp?.status ? ` (HTTP ${resp.status})` : ""}${details ? ` :: ${details}` : ""}`,
      );
    }
  }

  /**
   * Retrieve transaction details
   */
  async retrieveTransaction(
    transactionId: number,
  ): Promise<PaymobTransactionResponse> {
    try {
      const response = await this.withRetry(() =>
        this.executeWithAuthRetry((authToken) =>
          this.axios.get<PaymobTransactionResponse>(
            `/acceptance/transactions/${transactionId}`,
            {
              params: {
                token: authToken,
              },
            },
          ),
        ),
      );

      return response.data;
    } catch (error: unknown) {
      const message =
        (
          error as {
            response?: { data?: { detail?: string } };
            message?: string;
          }
        )?.response?.data?.detail ||
        (error as { message?: string })?.message ||
        "Failed to retrieve transaction";
      throw new Error(`Paymob transaction retrieval error: ${message}`);
    }
  }

  /**
   * Verify HMAC signature from webhook
   *
   * According to Paymob documentation, HMAC is calculated using:
   * - Multiple fields from the transaction object (obj)
   * - Fields sorted alphabetically by key
   * - HMAC secret used as the key for crypto.createHmac()
   *
   * @param transaction - The transaction object from webhook payload (obj field)
   * @param hmac - The HMAC signature from webhook payload
   * @returns true if HMAC is valid, false otherwise
   */
  verifyWebhookSignature(
    transaction: {
      amount_cents: number;
      created_at: string;
      currency: string;
      error_occured?: boolean;
      has_parent_transaction: boolean;
      id: number;
      integration_id: number;
      is_3d_secure: boolean;
      is_auth: boolean;
      is_capture: boolean;
      is_refunded: boolean;
      is_standalone_payment?: boolean;
      is_voided: boolean;
      order: { id: number };
      owner?: number;
      pending: boolean;
      source_data?: {
        pan?: string;
        sub_type?: string;
        type?: string;
      };
      success: boolean;
    },
    hmac: string,
  ): boolean {
    try {
      // Build HMAC data string from transaction fields, sorted alphabetically
      // Note: Some fields may be optional, so we handle them safely
      const hmacDataSource: Record<string, string | number | boolean> = {
        amount_cents: transaction.amount_cents,
        created_at: transaction.created_at,
        currency: transaction.currency,
        error_occured: transaction.error_occured ?? false,
        has_parent_transaction: transaction.has_parent_transaction,
        id: transaction.id,
        integration_id: transaction.integration_id,
        is_3d_secure: transaction.is_3d_secure,
        is_auth: transaction.is_auth,
        is_capture: transaction.is_capture,
        is_refunded: transaction.is_refunded,
        is_standalone_payment: transaction.is_standalone_payment ?? false,
        is_voided: transaction.is_voided,
        order: transaction.order.id,
        owner: transaction.owner ?? 0,
        pending: transaction.pending,
        "source_data.pan": transaction.source_data?.pan ?? "",
        "source_data.sub_type": transaction.source_data?.sub_type ?? "",
        "source_data.type": transaction.source_data?.type ?? "",
        success: transaction.success,
      };

      // Sort keys alphabetically and concatenate values
      const hmacString = Object.keys(hmacDataSource)
        .sort()
        .map((key) => String(hmacDataSource[key]))
        .join("");

      // Calculate HMAC using the secret as the key (not as part of the data)
      const calculatedHmac = crypto
        .createHmac("sha512", this.config.hmacSecret)
        .update(hmacString)
        .digest("hex");

      // Use timing-safe comparison to prevent timing attacks
      if (calculatedHmac.length !== hmac.length) {
        return false;
      }

      return crypto.timingSafeEqual(
        Buffer.from(calculatedHmac, "hex"),
        Buffer.from(hmac, "hex"),
      );
    } catch (error) {
      console.error("[Paymob] HMAC verification error:", error);
      return false;
    }
  }

  /**
   * Get integration ID based on payment method
   *
   * Supports all Paymob integration types:
   * - card / CARD → Online Card integration
   * - wallet / WALLET → Mobile Wallet integration
   * - installments → Uses card integration (installments handled by iframe)
   * - subscription → Subscription integration
   * - host → Host integration
   * - balance_transfer → Balance transfer
   * - cash_collection → Cash collection / deposit
   * - bill_payment → Bill payment
   *
   * Falls back to default card integration if specific integration not configured.
   */
  getIntegrationId(paymentMethod: string): number {
    const method = paymentMethod.toLowerCase();

    // Wallet integration
    if (
      (method === "wallet" || method === "w") &&
      this.config.walletIntegrationId
    ) {
      return this.config.walletIntegrationId;
    }

    // Subscription integration
    if (
      (method === "subscription" || method === "sub") &&
      this.config.subscriptionIntegrationId
    ) {
      return this.config.subscriptionIntegrationId;
    }

    // Host integration
    if (method === "host" && this.config.hostIntegrationId) {
      return this.config.hostIntegrationId;
    }

    // Balance transfer
    if (
      (method === "balance_transfer" || method === "balance") &&
      this.config.balanceTransferIntegrationId
    ) {
      return this.config.balanceTransferIntegrationId;
    }

    // Cash collection / deposit
    if (
      (method === "cash_collection" || method === "deposit") &&
      this.config.cashCollectionIntegrationId
    ) {
      return this.config.cashCollectionIntegrationId;
    }

    // Bill payment
    if (
      (method === "bill_payment" || method === "bill") &&
      this.config.billPaymentIntegrationId
    ) {
      return this.config.billPaymentIntegrationId;
    }

    // Installments use card integration (installment options shown in iframe)
    if (method === "installments") {
      return this.config.integrationId;
    }

    // Default: Card integration for card payments and any unmatched methods
    return this.config.integrationId;
  }

  /**
   * Check if installments are supported (based on iframe configuration)
   */
  supportsInstallments(): boolean {
    // Installments are supported via the custom iframe (983628)
    // This is determined by Paymob iframe configuration, not integration ID
    return true;
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
 * Supports all production integration types
 */
export function createPaymobClient(): PaymobClient | null {
  const apiKey = process.env.PAYMOB_API_KEY;
  const secretKey = process.env.PAYMOB_SECRET_KEY;
  const publicKey = process.env.PAYMOB_PUBLIC_KEY;
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
  const integrationId = process.env.PAYMOB_INTEGRATION_ID;
  const walletIntegrationId = process.env.PAYMOB_WALLET_INTEGRATION_ID;
  const subscriptionIntegrationId = process.env.PAYMOB_INTEGRATION_SUBSCRIPTION;
  const hostIntegrationId = process.env.PAYMOB_INTEGRATION_HOST;
  const balanceTransferIntegrationId =
    process.env.PAYMOB_INTEGRATION_BALANCE_TRANSFER;
  const cashCollectionIntegrationId =
    process.env.PAYMOB_INTEGRATION_CASH_COLLECTION;
  const billPaymentIntegrationId = process.env.PAYMOB_INTEGRATION_BILL_PAYMENT;
  const environment = (process.env.PAYMOB_ENVIRONMENT || "sandbox") as
    | "sandbox"
    | "production";

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
    walletIntegrationId: walletIntegrationId
      ? parseInt(walletIntegrationId, 10)
      : undefined,
    subscriptionIntegrationId: subscriptionIntegrationId
      ? parseInt(subscriptionIntegrationId, 10)
      : undefined,
    hostIntegrationId: hostIntegrationId
      ? parseInt(hostIntegrationId, 10)
      : undefined,
    balanceTransferIntegrationId: balanceTransferIntegrationId
      ? parseInt(balanceTransferIntegrationId, 10)
      : undefined,
    cashCollectionIntegrationId: cashCollectionIntegrationId
      ? parseInt(cashCollectionIntegrationId, 10)
      : undefined,
    billPaymentIntegrationId: billPaymentIntegrationId
      ? parseInt(billPaymentIntegrationId, 10)
      : undefined,
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
