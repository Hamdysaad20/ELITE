"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/auth/apiClient";
import type { Order } from "@/types";

interface UseOrderReturn {
  order: Order | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch full order details including items
 */
export function useOrder(orderId: string): UseOrderReturn {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<Order>(`/api/orders/${orderId}`);
      
      // Convert date strings to Date objects
      const orderWithDates: Order = {
        ...response,
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
      };
      
      setOrder(orderWithDates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load order";
      setError(errorMessage);
      console.error("Failed to fetch order:", err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    order,
    loading,
    error,
    refetch: fetchOrder,
  };
}

