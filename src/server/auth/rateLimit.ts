import { redisIncr, redisGet, redisSet, redisExpire } from "@/server/cache/redis";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix: string; // Redis key prefix
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Rate limiter using Redis for distributed rate limiting
 * Implements a sliding window counter strategy
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const key = `${config.keyPrefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Get current count
    const countData = await redisGet<number>(key);
    const count = countData || 0;

    if (count >= config.maxRequests) {
      // Rate limit exceeded
      const ttl = Math.ceil(config.windowMs / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(now + ttl * 1000),
      };
    }

    // Increment counter
    const newCount = await redisIncr(key);

    // Set expiry if this is the first request in the window
    if (newCount === 1) {
      const ttl = Math.ceil(config.windowMs / 1000);
      await redisExpire(key, ttl);
    }

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - newCount),
      resetAt: new Date(now + config.windowMs),
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Fail open: allow the request if Redis is down
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(now + config.windowMs),
    };
  }
}

/**
 * Rate limit configurations for different auth operations
 */
export const AUTH_RATE_LIMITS = {
  MAGIC_LINK: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 magic links per hour per email
    keyPrefix: "ratelimit:auth:magiclink",
  },
  LOGIN_ATTEMPTS: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 attempts per 15 minutes per IP
    keyPrefix: "ratelimit:auth:login",
  },
  SESSION_CREATE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 session creations per minute per email
    keyPrefix: "ratelimit:auth:session",
  },
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 password reset requests per hour
    keyPrefix: "ratelimit:auth:password",
  },
};

/**
 * Helper to extract client IP from request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

/**
 * Helper to check and enforce rate limit, returns error response if exceeded
 */
export async function enforceRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<{ allowed: true } | { allowed: false; error: string; resetAt: Date }> {
  const result = await checkRateLimit(identifier, config);

  if (!result.allowed) {
    return {
      allowed: false,
      error: `Too many requests. Please try again at ${result.resetAt.toISOString()}`,
      resetAt: result.resetAt,
    };
  }

  return { allowed: true };
}

