"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/auth/apiClient";
import type { DealProduct, ComboDeal, Deal } from "@/types/deals";

// Re-export types for backward compatibility
export type { DealProduct, ComboDeal, Deal };

export interface DealsResponse {
  deals: Deal[];
  count?: number;
  totalProducts?: number;
  message?: string;
}

interface UseDealsReturn {
  deals: Deal[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isEmpty: boolean;
  totalProducts: number;
}

/**
 * Hook to fetch all deals from the API
 * 
 * @example
 * ```tsx
 * const { deals, loading, error } = useDeals();
 * 
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error} />;
 * 
 * return deals.map(deal => (
 *   <DealSection key={deal.id} deal={deal} />
 * ));
 * ```
 */
export function useDeals(includeInactive: boolean = true): UseDealsReturn {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (includeInactive) {
        params.append("includeInactive", "true");
      }

      const url = `/api/deals${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await apiClient.get<DealsResponse>(url);

      setDeals(response.deals || []);
      setTotalProducts(response.totalProducts || 0);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load deals";
      setError(errorMessage);
      console.error("Failed to fetch deals:", err);

      // Provide user-friendly error messages
      if (errorMessage.includes("503") || errorMessage.includes("cache")) {
        setError("Deals are being synchronized. Please try again in a moment.");
      } else if (
        errorMessage.includes("Network") ||
        errorMessage.includes("Failed to fetch")
      ) {
        setError("Unable to connect. Please check your internet connection.");
      }
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const isEmpty = !loading && !error && deals.length === 0;

  return {
    deals,
    loading,
    error,
    refetch: fetchDeals,
    isEmpty,
    totalProducts,
  };
}
