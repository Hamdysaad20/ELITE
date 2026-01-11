"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface PurchasedProduct {
  productId: string;
  productName: string;
  purchaseDate: Date;
}

interface UseUserPurchasesReturn {
  hasPurchased: (productId: string) => boolean;
  purchases: PurchasedProduct[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to check if user has purchased products
 * Used to verify purchase history for reviews
 */
export function useUserPurchases(): UseUserPurchasesReturn {
  const { data: session, status } = useSession();
  const [purchases, setPurchases] = useState<PurchasedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      if (status === "loading") return;

      if (!session?.user) {
        setPurchases([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/user/purchases", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch purchase history");
        }

        const data = await response.json();
        if (data.success && data.data) {
          setPurchases(data.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Failed to fetch purchases:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [session, status]);

  const hasPurchased = (productId: string): boolean => {
    return purchases.some((p) => p.productId === productId);
  };

  return {
    hasPurchased,
    purchases,
    loading,
    error,
  };
}
