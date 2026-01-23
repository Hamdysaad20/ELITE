"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { apiClient } from "@/lib/auth/apiClient";

export interface Category {
  id: string;
  name: string;
  description?: string;
  productCount?: number;
  image?: string;
  sequence?: number; // Sort order
  parentId?: string; // Parent category
}

export interface CategoriesResponse {
  categories: Category[];
  lastUpdate?: string;
  count?: number;
}

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
  refetch: () => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  isEmpty: boolean;
  isRefetching: boolean;
}

/**
 * Hook to fetch categories from the API (cache-backed)
 *
 * @example
 * ```tsx
 * const { categories, loading, error } = useCategories();
 *
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error} />;
 *
 * return categories.map(c => (
 *   <CategoryCard key={c.id} category={c} />
 * ));
 * ```
 */
export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await apiClient.get<CategoriesResponse>("/api/categories");

      startTransition(() => {
        setCategories(response?.categories || []);
        setLastUpdate(response?.lastUpdate || null);
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load categories";
      setError(errorMessage);
      console.error("Failed to fetch categories:", err);

      // Provide user-friendly error messages
      if (
        errorMessage.includes("503") ||
        errorMessage.includes("cache is empty")
      ) {
        setError(
          "Category list is being synchronized. Please try again in a moment.",
        );
      } else if (
        errorMessage.includes("Network") ||
        errorMessage.includes("Failed to fetch")
      ) {
        setError("Unable to connect. Please check your internet connection.");
      } else if (errorMessage.includes("timeout")) {
        setError("Request timed out. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const getCategoryById = useCallback(
    (id: string) => categories.find((c) => c?.id === id),
    [categories],
  );

  const isEmpty = !loading && !error && categories.length === 0;

  return {
    categories,
    loading,
    error,
    lastUpdate,
    refetch: fetchCategories,
    getCategoryById,
    isEmpty,
    isRefetching: isPending,
  };
}
