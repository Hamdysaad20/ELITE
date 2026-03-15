import { useEffect, useState, useCallback } from "react";
import type { LovedByLocalProduct } from "@/app/api/recommendations/loved-by-locals/route";

interface UseRecommendedProductsReturn {
    products: LovedByLocalProduct[];
    loading: boolean;
    error: string | null;
    isPersonalized: boolean;
    refetch: () => Promise<void>;
}

/**
 * Hook to fetch recommended products for "Loved by Locals" section
 * Automatically mixes user preferences + bestsellers
 *
 * Returns 4 products intelligent based on:
 * - 50% User's favorite categories
 * - 25% Bestsellers
 * - 25% Random variety
 */
export function useRecommendedProducts(): UseRecommendedProductsReturn {
    const [products, setProducts] = useState<LovedByLocalProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPersonalized, setIsPersonalized] = useState(false);

    const fetchRecommendations = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                "/api/recommendations/loved-by-locals",
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    // Credentials: include auth cookies for personalization
                    credentials: "include",
                },
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch recommendations: ${response.statusText}`,
                );
            }

            const data = await response.json();

            if (data.success && data.data) {
                setProducts(data.data?.products || []);
                // Mark as personalized if using live data (vs fallback)
                setIsPersonalized(data.data?.isUsing === "live-data");
            } else {
                throw new Error(data.message || "Failed to load recommendations");
            }
        } catch (err) {
            console.error("Error fetching recommendations:", err);
            setError(
                err instanceof Error ? err.message : "Failed to load recommendations",
            );
            // Fallback to empty array on error (component handles gracefully)
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on mount
    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    return {
        products,
        loading,
        error,
        isPersonalized,
        refetch: fetchRecommendations,
    };
}
