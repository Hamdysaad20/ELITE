"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@/lib/auth/apiClient";
import { Order as OrderType } from "@/types";

export interface OrderStatus {
  id: string;
  status: string;
  paymentStatus: string;
  odooStatusSale: string;
  odooStatusPos: string;
  saleOrderId?: number;
  posOrderId?: number;
  odooWebUrl?: string;
  integrationStatus?: {
    sale?: {
      synced: boolean;
      orderId?: number;
      status: string;
      url?: string;
    };
    pos?: {
      synced: boolean;
      orderId?: number;
      status: string;
    };
  };
}

interface UseOrderStatusOptions {
  orderId: string;
  pollInterval?: number; // milliseconds, default 3000 (3 seconds)
  enabled?: boolean; // whether polling is enabled
  stopWhen?: (status: OrderStatus) => boolean; // stop polling when condition is met
}

interface UseOrderStatusReturn {
  status: OrderStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isPolling: boolean;
  stopPolling: () => void;
  startPolling: () => void;
}

/**
 * Hook to fetch and poll order status with Odoo integration status
 *
 * @example
 * ```tsx
 * const { status, isPolling, loading } = useOrderStatus({
 *   orderId: "order-123",
 *   pollInterval: 5000,
 *   stopWhen: (s) => s.odooStatusSale === "synced" && s.odooStatusPos === "synced"
 * });
 *
 * return (
 *   <div>
 *     <p>Status: {status?.status}</p>
 *     <p>Odoo Sale: {status?.odooStatusSale}</p>
 *     {isPolling && <Spinner />}
 *   </div>
 * );
 * ```
 */
export function useOrderStatus(
  options: UseOrderStatusOptions,
): UseOrderStatusReturn {
  const { orderId, pollInterval = 3000, enabled = true, stopWhen } = options;

  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(enabled);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const streamRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch order status
  const fetchStatus = useCallback(async () => {
    if (!orderId || !isMountedRef.current) return;

    try {
      if (loading) {
        setError(null);
      }

      const response = await apiClient.get<OrderStatus>(
        `/api/orders/${orderId}/status`,
      );

      if (isMountedRef.current) {
        setStatus(response);
        setLoading(false);

        // Check if we should stop polling
        if (stopWhen && stopWhen(response)) {
          setIsPolling(false);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load order status";
        setError(errorMessage);
        setLoading(false);
        console.error("Failed to fetch order status:", err);
      }
    }
  }, [orderId, loading, stopWhen]);

  const connectRealtime = useCallback(() => {
    if (!orderId || !enabled || !isMountedRef.current) return;

    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }

    const source = new EventSource(`/api/orders/${orderId}/status/stream`);
    streamRef.current = source;

    source.addEventListener("status", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as OrderStatus;

        if (!isMountedRef.current) return;

        setStatus(payload);
        setLoading(false);
        setError(null);

        if (stopWhen && stopWhen(payload)) {
          setIsPolling(false);
          source.close();
          streamRef.current = null;
        }
      } catch (err) {
        console.error("Failed to parse order status stream payload:", err);
      }
    });

    source.addEventListener("app_error", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data);
        console.warn("Order stream app error:", payload?.message);
      } catch {
        // ignore parse failures
      }
      source.close();
      streamRef.current = null;
    });

    source.addEventListener("end", () => {
      source.close();
      streamRef.current = null;
      if (!isMountedRef.current || !enabled) return;
      clearTimeout(reconnectTimerRef.current!);
      reconnectTimerRef.current = setTimeout(connectRealtime, 1500);
    });

    source.addEventListener("error", () => {
      source.close();
      streamRef.current = null;
      if (!isMountedRef.current || !enabled) return;
      clearTimeout(reconnectTimerRef.current!);
      reconnectTimerRef.current = setTimeout(connectRealtime, 3000);
    });
  }, [orderId, enabled, stopWhen]);

  // Start polling
  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  // Stop polling
  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Set up polling
  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch
    fetchStatus();

    connectRealtime();

    // Set up polling if enabled
    if (isPolling && enabled) {
      pollIntervalRef.current = setInterval(() => {
        fetchStatus();
      }, pollInterval);
    }

    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.close();
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [orderId, pollInterval, isPolling, enabled, fetchStatus, connectRealtime]);

  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
    isPolling,
    stopPolling,
    startPolling,
  };
}

/**
 * Hook to fetch all orders with pagination
 */
export function useOrders(options: { limit?: number; offset?: number } = {}) {
  const { limit = 20, offset = 0 } = options;
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("limit", String(limit));
      params.append("offset", String(offset));

      const response = await apiClient.get<{ orders: OrderType[] }>(
        `/api/orders?${params.toString()}`,
      );
      setOrders(response.orders || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load orders";
      setError(errorMessage);
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
  };
}
