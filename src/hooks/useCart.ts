"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/auth/apiClient";
import type { Cart } from "@/types";

interface UseCartReturn {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  addToCart: (
    menuItemId: string,
    quantity: number,
    options?: {
      size?: string;
      flavor?: string;
      toppings?: string[];
    },
  ) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  itemCount: number;
  total: number;
}

/**
 * Custom hook for managing shopping cart (with NextAuth authentication)
 *
 * Usage:
 * ```tsx
 * const { cart, addToCart, removeFromCart, loading } = useCart();
 *
 * if (loading) return <Spinner />;
 * 
 * // Add item to cart
 * await addToCart('item-id', 2, { size: 'Large', flavor: 'Vanilla' });
 * ```
 * 
 * Note: Automatically handles authentication via NextAuth session.
 * Cart is user-specific and persists across sessions.
 */
export function useCart(): UseCartReturn {
  const { data: session, status } = useSession();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart from API
  const fetchCart = useCallback(async () => {
    // Don't fetch if not authenticated
    if (status !== "authenticated") {
      setCart(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<{ cart: Cart }>("/api/cart");
      setCart(response.cart);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load cart");
      }
      console.error("Failed to fetch cart:", err);
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [status]);

  // Fetch cart when session is ready
  useEffect(() => {
    if (status !== "loading") {
      fetchCart();
    }
  }, [status, fetchCart]);

  // Add item to cart
  const addToCart = useCallback(
    async (
      menuItemId: string,
      quantity: number,
      options?: {
        size?: string;
        flavor?: string;
        toppings?: string[];
      },
    ) => {
      if (status !== "authenticated") {
        throw new Error("Please sign in to add items to cart");
      }

      try {
        setError(null);

        await apiClient.post("/api/cart", {
          menuItemId,
          quantity,
          ...options,
        });

        // Refresh cart after adding
        await fetchCart();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add item to cart";
        setError(errorMessage);
        console.error("Failed to add item to cart:", err);
        throw err;
      }
    },
    [status, fetchCart],
  );

  // Remove item from cart
  const removeFromCart = useCallback(
    async (cartItemId: string) => {
      if (status !== "authenticated") {
        throw new Error("Please sign in to modify cart");
      }

      try {
        setError(null);

        await apiClient.delete(`/api/cart/${cartItemId}`);

        // Refresh cart after removing
        await fetchCart();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to remove item";
        setError(errorMessage);
        console.error("Failed to remove item from cart:", err);
        throw err;
      }
    },
    [status, fetchCart],
  );

  // Update item quantity
  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      if (status !== "authenticated") {
        throw new Error("Please sign in to modify cart");
      }

      try {
        setError(null);

        await apiClient.patch(`/api/cart/${cartItemId}`, { quantity });

        // Refresh cart after updating
        await fetchCart();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update quantity";
        setError(errorMessage);
        console.error("Failed to update quantity:", err);
        throw err;
      }
    },
    [status, fetchCart],
  );

  // Clear entire cart
  const clearCart = useCallback(async () => {
    if (status !== "authenticated") {
      throw new Error("Please sign in to modify cart");
    }

    try {
      setError(null);

      await apiClient.delete("/api/cart");

      setCart(null);
      await fetchCart();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to clear cart";
      setError(errorMessage);
      console.error("Failed to clear cart:", err);
      throw err;
    }
  }, [status, fetchCart]);

  // Calculate item count
  const itemCount =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Calculate total
  const total = cart?.items.reduce((sum, item) => sum + item.price, 0) || 0;

  return {
    cart,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart: fetchCart,
    itemCount,
    total,
  };
}
