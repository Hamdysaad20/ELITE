"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/auth/apiClient";
import type { Order } from "@/types";

type OrderStatusSnapshot = {
  status: string;
  paymentStatus: string;
  odooStatusSale: string;
  odooStatusPos: string;
  updatedAt: string | Date;
};

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

  const fetchOrderStatus = useCallback(async () => {
    if (!orderId) return;

    try {
      const response = await apiClient.get<OrderStatusSnapshot>(
        `/api/orders/${orderId}/status`,
      );

      setOrder((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          status: response.status as Order["status"],
          paymentStatus: response.paymentStatus as Order["paymentStatus"],
          updatedAt: new Date(response.updatedAt),
        };
      });
    } catch (err) {
      console.warn("Failed to refresh order status:", err);
    }
  }, [orderId]);

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

      // Refresh canonical status from the Odoo-sync endpoint.
      await fetchOrderStatus();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load order";
      setError(errorMessage);
      console.error("Failed to fetch order:", err);
    } finally {
      setLoading(false);
    }
  }, [orderId, fetchOrderStatus]);

  useEffect(() => {
    fetchOrder();

    const interval = setInterval(() => {
      fetchOrderStatus();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchOrder, fetchOrderStatus]);

  return {
    order,
    loading,
    error,
    refetch: fetchOrder,
  };
}
