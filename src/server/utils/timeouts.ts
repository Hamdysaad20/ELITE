/**
 * Request timeout utilities
 * Reasonable timeouts to prevent hanging requests
 */

/**
 * Timeout configurations for different operations
 * Values are in milliseconds
 */
export const REQUEST_TIMEOUTS = {
  ORDER_CREATE: 30000, // 30 seconds (order creation can take time)
  ORDER_STATUS: 10000, // 10 seconds (status checks should be fast)
  PAYMENT_CREATE: 20000, // 20 seconds (payment intent creation)
  PAYMENT_STATUS: 10000, // 10 seconds (status checks)
  PAYMENT_WEBHOOK: 5000, // 5 seconds (webhook processing)
  API_DEFAULT: 15000, // 15 seconds (default for most API calls)
} as const;

/**
 * Create a fetch with timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = REQUEST_TIMEOUTS.API_DEFAULT,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  }
}

/**
 * Wrap a promise with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeout: number = REQUEST_TIMEOUTS.API_DEFAULT,
  errorMessage: string = "Operation timed out. Please try again.",
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeout),
    ),
  ]);
}
