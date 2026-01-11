/**
 * Circuit Breaker Pattern for Odoo API calls
 *
 * Prevents cascading failures by stopping sync attempts when Odoo is consistently failing.
 *
 * States:
 * - CLOSED: Normal operation, requests allowed
 * - OPEN: Too many failures, requests blocked
 * - HALF_OPEN: Testing if service recovered, allows limited requests
 *
 * Configuration:
 * - failureThreshold: Number of consecutive failures before opening circuit (default: 5)
 * - successThreshold: Number of successes needed to close from half-open (default: 2)
 * - timeout: How long to stay open before trying half-open (default: 60s)
 */

import { redisGet, redisSet, redisDel } from "../cache/redis";

const CIRCUIT_BREAKER_KEY = "circuit:odoo:state";
const CIRCUIT_BREAKER_FAILURES_KEY = "circuit:odoo:failures";
const CIRCUIT_BREAKER_SUCCESSES_KEY = "circuit:odoo:successes";
const CIRCUIT_BREAKER_OPENED_AT_KEY = "circuit:odoo:opened_at";

export enum CircuitState {
  CLOSED = "closed", // Normal operation
  OPEN = "open", // Blocking requests due to failures
  HALF_OPEN = "half_open", // Testing if service recovered
}

interface CircuitBreakerConfig {
  failureThreshold: number; // Failures needed to open circuit (default: 5)
  successThreshold: number; // Successes needed to close from half-open (default: 2)
  timeoutMs: number; // Time to wait before trying half-open (default: 60000)
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeoutMs: 60000, // 1 minute
};

/**
 * Get current circuit breaker state
 */
export async function getCircuitState(): Promise<CircuitState> {
  try {
    const state = await redisGet<string>(CIRCUIT_BREAKER_KEY);
    if (state && Object.values(CircuitState).includes(state as CircuitState)) {
      return state as CircuitState;
    }
    return CircuitState.CLOSED; // Default to closed
  } catch (err) {
    // If Redis fails, assume closed (fail open, not closed)
    console.warn(
      "[CIRCUIT-BREAKER] Failed to read state, assuming CLOSED:",
      err,
    );
    return CircuitState.CLOSED;
  }
}

/**
 * Record a successful Odoo operation
 */
export async function recordSuccess(
  config: CircuitBreakerConfig = DEFAULT_CONFIG,
): Promise<void> {
  try {
    const currentState = await getCircuitState();

    if (currentState === CircuitState.HALF_OPEN) {
      // In half-open, count successes
      const currentSuccesses =
        (await redisGet<number>(CIRCUIT_BREAKER_SUCCESSES_KEY)) || 0;
      const newSuccesses = currentSuccesses + 1;

      if (newSuccesses >= config.successThreshold) {
        // Enough successes, close the circuit
        await Promise.all([
          redisSet(CIRCUIT_BREAKER_KEY, CircuitState.CLOSED, 3600),
          redisDel(CIRCUIT_BREAKER_FAILURES_KEY),
          redisDel(CIRCUIT_BREAKER_SUCCESSES_KEY),
          redisDel(CIRCUIT_BREAKER_OPENED_AT_KEY),
        ]);
        console.log("[CIRCUIT-BREAKER] Circuit CLOSED - Odoo is healthy again");
      } else {
        await redisSet(CIRCUIT_BREAKER_SUCCESSES_KEY, newSuccesses, 3600);
      }
    } else if (currentState === CircuitState.CLOSED) {
      // Reset failure count on success
      await redisDel(CIRCUIT_BREAKER_FAILURES_KEY);
    }
    // If OPEN, do nothing (wait for timeout)
  } catch (err) {
    console.warn("[CIRCUIT-BREAKER] Failed to record success:", err);
  }
}

/**
 * Record a failed Odoo operation
 */
export async function recordFailure(
  config: CircuitBreakerConfig = DEFAULT_CONFIG,
): Promise<void> {
  try {
    const currentState = await getCircuitState();

    if (currentState === CircuitState.HALF_OPEN) {
      // Failure in half-open immediately opens circuit
      await Promise.all([
        redisSet(CIRCUIT_BREAKER_KEY, CircuitState.OPEN, 3600),
        redisSet(CIRCUIT_BREAKER_OPENED_AT_KEY, Date.now().toString(), 3600),
        redisDel(CIRCUIT_BREAKER_SUCCESSES_KEY),
      ]);
      console.warn("[CIRCUIT-BREAKER] Circuit OPENED - Odoo still failing");
    } else if (currentState === CircuitState.CLOSED) {
      // Count failures
      const currentFailures =
        (await redisGet<number>(CIRCUIT_BREAKER_FAILURES_KEY)) || 0;
      const newFailures = currentFailures + 1;

      if (newFailures >= config.failureThreshold) {
        // Too many failures, open circuit
        await Promise.all([
          redisSet(CIRCUIT_BREAKER_KEY, CircuitState.OPEN, 3600),
          redisSet(CIRCUIT_BREAKER_OPENED_AT_KEY, Date.now().toString(), 3600),
          redisDel(CIRCUIT_BREAKER_FAILURES_KEY),
        ]);
        console.error(
          `[CIRCUIT-BREAKER] Circuit OPENED after ${newFailures} failures`,
        );
      } else {
        await redisSet(CIRCUIT_BREAKER_FAILURES_KEY, newFailures, 3600);
        console.warn(
          `[CIRCUIT-BREAKER] Failure ${newFailures}/${config.failureThreshold}`,
        );
      }
    }
    // If already OPEN, do nothing
  } catch (err) {
    console.warn("[CIRCUIT-BREAKER] Failed to record failure:", err);
  }
}

/**
 * Check if request should be allowed (circuit breaker check)
 * Returns true if request should proceed, false if blocked
 */
export async function isRequestAllowed(
  config: CircuitBreakerConfig = DEFAULT_CONFIG,
): Promise<boolean> {
  try {
    const state = await getCircuitState();

    if (state === CircuitState.CLOSED) {
      return true; // Always allow in closed state
    }

    if (state === CircuitState.OPEN) {
      // Check if timeout has passed, transition to half-open
      const openedAtStr = await redisGet<string>(CIRCUIT_BREAKER_OPENED_AT_KEY);
      if (openedAtStr) {
        const openedAt = parseInt(openedAtStr, 10);
        const timeSinceOpen = Date.now() - openedAt;

        if (timeSinceOpen >= config.timeoutMs) {
          // Timeout passed, try half-open
          await Promise.all([
            redisSet(CIRCUIT_BREAKER_KEY, CircuitState.HALF_OPEN, 3600),
            redisSet(CIRCUIT_BREAKER_SUCCESSES_KEY, 0, 3600),
          ]);
          console.log(
            "[CIRCUIT-BREAKER] Circuit HALF_OPEN - testing if Odoo recovered",
          );
          return true; // Allow one request to test
        }
      }
      return false; // Still in open state, block request
    }

    if (state === CircuitState.HALF_OPEN) {
      return true; // Allow requests in half-open (testing)
    }

    return true; // Default to allowing (fail open)
  } catch (err) {
    // If Redis fails, allow requests (fail open, not closed)
    console.warn(
      "[CIRCUIT-BREAKER] Failed to check state, allowing request:",
      err,
    );
    return true;
  }
}

/**
 * Get circuit breaker status for monitoring
 */
export async function getCircuitStatus(): Promise<{
  state: CircuitState;
  failures: number;
  successes: number;
  openedAt: number | null;
}> {
  try {
    const [state, failures, successes, openedAtStr] = await Promise.all([
      getCircuitState(),
      redisGet<number>(CIRCUIT_BREAKER_FAILURES_KEY),
      redisGet<number>(CIRCUIT_BREAKER_SUCCESSES_KEY),
      redisGet<string>(CIRCUIT_BREAKER_OPENED_AT_KEY),
    ]);

    return {
      state,
      failures: failures || 0,
      successes: successes || 0,
      openedAt: openedAtStr ? parseInt(openedAtStr, 10) : null,
    };
  } catch (err) {
    console.warn("[CIRCUIT-BREAKER] Failed to get status:", err);
    return {
      state: CircuitState.CLOSED,
      failures: 0,
      successes: 0,
      openedAt: null,
    };
  }
}

/**
 * Manually reset circuit breaker (for admin/debugging)
 */
export async function resetCircuitBreaker(): Promise<void> {
  try {
    await Promise.all([
      redisSet(CIRCUIT_BREAKER_KEY, CircuitState.CLOSED, 3600),
      redisDel(CIRCUIT_BREAKER_FAILURES_KEY),
      redisDel(CIRCUIT_BREAKER_SUCCESSES_KEY),
      redisDel(CIRCUIT_BREAKER_OPENED_AT_KEY),
    ]);
    console.log("[CIRCUIT-BREAKER] Manually reset to CLOSED");
  } catch (err) {
    console.error("[CIRCUIT-BREAKER] Failed to reset:", err);
    throw err;
  }
}
