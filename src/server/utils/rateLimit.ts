/**
 * Rate limiting utilities for orders and payments
 * Uses Redis for distributed rate limiting
 */

import { checkRateLimit, type RateLimitConfig } from "@/server/auth/rateLimit";

export const GENERIC_RATE_LIMITS = {
  AUTH: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 login/register attempts per hour
    keyPrefix: "ratelimit:auth",
  },
  CART: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 cart operations per minute
    keyPrefix: "ratelimit:cart",
  },
  PRODUCTS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120, // 120 product reads per minute
    keyPrefix: "ratelimit:products",
  },
} as const;

/**
 * Rate limit configurations for order and payment operations
 * Reasonable limits to prevent abuse without impacting legitimate users
 */
export const ORDER_RATE_LIMITS = {
  ORDER_CREATE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 orders per minute per user (reasonable for legitimate use)
    keyPrefix: "ratelimit:order:create",
  },
  ORDER_STATUS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 status checks per minute (for polling)
    keyPrefix: "ratelimit:order:status",
  },
} as const;

export const PAYMENT_RATE_LIMITS = {
  PAYMENT_CREATE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 payment attempts per minute (prevents abuse)
    keyPrefix: "ratelimit:payment:create",
  },
  PAYMENT_STATUS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 status checks per minute (for polling)
    keyPrefix: "ratelimit:payment:status",
  },
  PAYMENT_WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50, // 50 webhooks per minute (from Paymob)
    keyPrefix: "ratelimit:payment:webhook",
  },
} as const;

/**
 * Check rate limit for order operations
 */
export async function checkOrderRateLimit(
  userId: string,
  operation: keyof typeof ORDER_RATE_LIMITS,
): Promise<{ allowed: boolean; resetAt?: Date }> {
  const config = ORDER_RATE_LIMITS[operation];
  const result = await checkRateLimit(userId, config);

  return {
    allowed: result.allowed,
    resetAt: result.resetAt,
  };
}

/**
 * Check rate limit for payment operations
 */
export async function checkPaymentRateLimit(
  userId: string,
  operation: keyof typeof PAYMENT_RATE_LIMITS,
): Promise<{ allowed: boolean; resetAt?: Date }> {
  const config = PAYMENT_RATE_LIMITS[operation];
  const result = await checkRateLimit(userId, config);

  return {
    allowed: result.allowed,
    resetAt: result.resetAt,
  };
}

/**
 * Check rate limit for generic operations (Auth, Cart, Products)
 */
export async function checkGenericRateLimit(
  userIdOrIp: string,
  operation: keyof typeof GENERIC_RATE_LIMITS,
): Promise<{ allowed: boolean; resetAt?: Date }> {
  const config = GENERIC_RATE_LIMITS[operation];
  const result = await checkRateLimit(userIdOrIp, config);

  return {
    allowed: result.allowed,
    resetAt: result.resetAt,
  };
}
