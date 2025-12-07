/**
 * Error Recovery Utilities
 * Provides retry logic, exponential backoff, and error classification
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, error: Error) => void;
}

export interface ErrorInfo {
  type: "network" | "timeout" | "server" | "client" | "unknown";
  isRetryable: boolean;
  message: string;
  statusCode?: number;
}

/**
 * Classify error type and determine if it's retryable
 */
export function classifyError(error: unknown): ErrorInfo {
  // Network errors (no connection)
  if (
    error instanceof TypeError &&
    (error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("Failed to fetch"))
  ) {
    return {
      type: "network",
      isRetryable: true,
      message: "Network connection lost. Please check your internet connection.",
    };
  }

  // Timeout errors
  if (
    error instanceof Error &&
    (error.name === "AbortError" ||
      error.message.includes("timeout") ||
      error.message.includes("timed out"))
  ) {
    return {
      type: "timeout",
      isRetryable: true,
      message: "Request timed out. The server took too long to respond.",
    };
  }

  // HTTP errors with status codes
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    
    // Server errors (5xx) - retryable
    if (status >= 500) {
      return {
        type: "server",
        isRetryable: true,
        statusCode: status,
        message:
          status === 503
            ? "Service temporarily unavailable. Please try again."
            : "Server error occurred. Please try again.",
      };
    }

    // Client errors (4xx) - not retryable (except 408, 429)
    if (status >= 400) {
      const isRetryable = status === 408 || status === 429;
      return {
        type: "client",
        isRetryable,
        statusCode: status,
        message:
          status === 401
            ? "Please sign in to continue."
            : status === 403
              ? "You don't have permission to perform this action."
              : status === 404
                ? "Resource not found."
                : status === 408
                  ? "Request timeout. Please try again."
                  : status === 429
                    ? "Too many requests. Please wait a moment."
                    : "Request failed. Please try again.",
      };
    }
  }

  // Generic error
  return {
    type: "unknown",
    isRetryable: false,
    message:
      error instanceof Error
        ? error.message
        : "An unexpected error occurred. Please try again.",
  };
}

/**
 * Sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffFactor: number,
): number {
  const delay = initialDelay * Math.pow(backoffFactor, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Retry a function with exponential backoff
 * 
 * @example
 * ```typescript
 * const data = await withRetry(
 *   async () => fetch('/api/products'),
 *   {
 *     maxRetries: 3,
 *     initialDelay: 1000,
 *     onRetry: (attempt, error) => {
 *       console.log(`Retry attempt ${attempt}:`, error.message);
 *     }
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryableStatuses = [408, 429, 500, 502, 503, 504],
    onRetry,
  } = options;

  let lastError: Error | unknown;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorInfo = classifyError(error);

      // Don't retry if not retryable
      if (!errorInfo.isRetryable && attempt === 0) {
        throw error;
      }

      // Check if status code is retryable
      if (
        errorInfo.statusCode &&
        !retryableStatuses.includes(errorInfo.statusCode)
      ) {
        throw error;
      }

      // No more retries left
      if (attempt >= maxRetries) {
        throw error;
      }

      attempt++;

      // Notify about retry
      if (onRetry && error instanceof Error) {
        onRetry(attempt, error);
      }

      // Wait before retrying with exponential backoff
      const delay = getBackoffDelay(
        attempt - 1,
        initialDelay,
        maxDelay,
        backoffFactor,
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Create a retry wrapper for API calls
 * 
 * @example
 * ```typescript
 * const apiWithRetry = createRetryWrapper({
 *   maxRetries: 3,
 *   initialDelay: 1000
 * });
 * 
 * const data = await apiWithRetry(() => 
 *   fetch('/api/products').then(r => r.json())
 * );
 * ```
 */
export function createRetryWrapper(defaultOptions: RetryOptions = {}) {
  return async function retryWrapper<T>(
    fn: () => Promise<T>,
    options?: RetryOptions,
  ): Promise<T> {
    return withRetry(fn, { ...defaultOptions, ...options });
  };
}

/**
 * Queue for offline requests
 */
export class OfflineRequestQueue {
  private queue: Array<{
    id: string;
    fn: () => Promise<unknown>;
    timestamp: number;
  }> = [];
  private isProcessing = false;

  /**
   * Add request to queue
   */
  add(fn: () => Promise<unknown>): string {
    const id = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.queue.push({ id, fn, timestamp: Date.now() });
    return id;
  }

  /**
   * Process all queued requests
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (!request) break;

      try {
        await request.fn();
      } catch (error) {
        console.error(`Failed to process queued request ${request.id}:`, error);
        // Re-queue if network error
        const errorInfo = classifyError(error);
        if (errorInfo.type === "network") {
          this.queue.push(request);
          break; // Stop processing if still offline
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Clear all queued requests
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Get queue size
   */
  get size(): number {
    return this.queue.length;
  }
}

/**
 * Global offline request queue
 */
export const offlineQueue = new OfflineRequestQueue();

/**
 * Setup online/offline event listeners
 */
export function setupOfflineSupport(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("online", () => {
    console.log("Connection restored. Processing queued requests...");
    offlineQueue.processQueue();
  });

  window.addEventListener("offline", () => {
    console.log("Connection lost. Requests will be queued.");
  });
}
