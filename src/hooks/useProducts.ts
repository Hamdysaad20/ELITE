"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/auth/apiClient";

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId?: string;
  categoryName?: string;
  image?: string;
  available: boolean;
  sku?: string;
  attributes?: Record<string, any>;
}

export interface ProductsResponse {
  products: Product[];
  lastUpdate?: string;
  count: number;
}

interface UseProductsOptions {
  categoryId?: string;
  search?: string;
  available?: boolean;
  autoFetch?: boolean;
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
  refetch: () => Promise<void>;
  getProductById: (id: string) => Product | undefined;
}

/**
 * Hook to fetch products from the API (cache-backed)
 * 
 * @example
 * ```tsx
 * const { products, loading, error } = useProducts({ categoryId: "coffee" });
 * 
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error} />;
 * 
 * return products.map(p => <ProductCard key={p.id} product={p} />);
 * ```
 */
export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const { categoryId, search, available, autoFetch = true } = options;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      if (categoryId) params.append("categoryId", categoryId);
      if (search) params.append("search", search);
      if (available !== undefined) params.append("available", String(available));

      const url = `/api/products${params.toString() ? `?${params.toString()}` : ""}`;
      
      const response = await apiClient.get<ProductsResponse>(url);
      
      setProducts(response.products || []);
      setLastUpdate(response.lastUpdate || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load products";
      setError(errorMessage);
      console.error("Failed to fetch products:", err);
      
      // If cache is empty (503), show helpful message
      if (errorMessage.includes("503")) {
        setError("Product catalog is being synchronized. Please try again in a moment.");
      }
    } finally {
      setLoading(false);
    }
  }, [categoryId, search, available]);

  // Auto-fetch on mount and when options change
  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch, fetchProducts]);

  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products],
  );

  return {
    products,
    loading,
    error,
    lastUpdate,
    refetch: fetchProducts,
    getProductById,
  };
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(productId: string | null) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(!!productId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get<{ product: Product; lastUpdate?: string }>(
          `/api/products/${productId}`,
        );

        setProduct(response.product);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load product";
        setError(errorMessage);
        console.error("Failed to fetch product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return { product, loading, error };
}


