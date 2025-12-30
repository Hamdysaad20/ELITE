/**
 * Simple analytics tracking
 * Non-intrusive, privacy-friendly analytics
 */

/**
 * Track order events
 */
export async function trackOrderEvent(
  event: "order_created" | "order_failed" | "order_completed",
  data: {
    orderId?: string;
    userId?: string;
    amount?: number;
    paymentMethod?: string;
    error?: string;
  }
): Promise<void> {
  try {
    // Simple console logging for now
    // Can be extended to send to analytics service
    console.log(`[Analytics] ${event}:`, {
      timestamp: new Date().toISOString(),
      ...data,
    });

    // In production, you could send to:
    // - Google Analytics
    // - Mixpanel
    // - Custom analytics endpoint
    // Example:
    // if (process.env.ANALYTICS_ENABLED === "true") {
    //   await fetch("/api/analytics", {
    //     method: "POST",
    //     body: JSON.stringify({ event, data }),
    //   });
    // }
  } catch (error) {
    // Silently fail - analytics should never break the app
    console.warn("[Analytics] Failed to track event:", error);
  }
}

/**
 * Track payment events
 */
export async function trackPaymentEvent(
  event: "payment_initiated" | "payment_success" | "payment_failed" | "payment_cancelled",
  data: {
    orderId?: string;
    userId?: string;
    amount?: number;
    paymentMethod?: string;
    error?: string;
  }
): Promise<void> {
  try {
    console.log(`[Analytics] ${event}:`, {
      timestamp: new Date().toISOString(),
      ...data,
    });
  } catch (error) {
    console.warn("[Analytics] Failed to track payment event:", error);
  }
}

/**
 * Track API performance
 */
export async function trackApiPerformance(
  endpoint: string,
  duration: number,
  status: number
): Promise<void> {
  try {
    // Only log slow requests (> 2 seconds)
    if (duration > 2000) {
      console.log(`[Analytics] Slow API request: ${endpoint} took ${duration}ms (status: ${status})`);
    }
  } catch (error) {
    // Silently fail
  }
}

