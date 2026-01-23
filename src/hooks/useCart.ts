"use client";

import {
  useState,
  useEffect,
  useCallback,
  useOptimistic,
  useTransition,
} from "react";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/auth/apiClient";
import type { Cart, CartItem } from "@/types";

interface UseCartReturn {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  isUpdating: boolean;
  addToCart: (
    menuItemId: string,
    quantity: number,
    options?: {
      size?: string;
      flavor?: string;
      toppings?: string[];
      attributes?: Record<string, unknown>;
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
type CartAction =
  | { type: "add"; item: CartItem }
  | { type: "remove"; itemId: string }
  | { type: "update"; itemId: string; quantity: number }
  | { type: "clear" };

function applyOptimisticUpdate(
  cart: Cart | null,
  action: CartAction,
): Cart | null {
  if (!cart) return cart;

  switch (action.type) {
    case "add": {
      const existingItemIndex = cart.items.findIndex(
        (item) => item.menuItemId === action.item.menuItemId,
      );
      if (existingItemIndex >= 0) {
        const newItems = [...cart.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + action.item.quantity,
        };
        return { ...cart, items: newItems };
      }
      return { ...cart, items: [...cart.items, action.item] };
    }
    case "remove":
      return {
        ...cart,
        items: cart.items.filter((item) => item.id !== action.itemId),
      };
    case "update":
      return {
        ...cart,
        items: cart.items.map((item) =>
          item.id === action.itemId
            ? { ...item, quantity: action.quantity }
            : item,
        ),
      };
    case "clear":
      return { ...cart, items: [] };
    default:
      return cart;
  }
}

export function useCart(): UseCartReturn {
  const { data: session, status } = useSession();
  const [cart, setCart] = useState<Cart | null>(null);
  const [optimisticCart, setOptimisticCart] = useOptimistic(
    cart,
    applyOptimisticUpdate,
  );
  const [isPending, startTransition] = useTransition();
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
      startTransition(() => {
        setCart(response.cart);
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load cart");
      }
      console.error("Failed to fetch cart:", err);
      startTransition(() => {
        setCart(null);
      });
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
        attributes?: Record<string, unknown>;
      },
    ) => {
      if (status !== "authenticated") {
        throw new Error("Please sign in to add items to cart");
      }

      // Create optimistic cart item
      const optimisticItem: CartItem = {
        id: `temp-${Date.now()}`,
        menuItemId,
        quantity,
        size: options?.size,
        flavor: options?.flavor,
        toppings: options?.toppings,
        price: 0, // Will be calculated by server
      };

      // Apply optimistic update immediately
      startTransition(() => {
        setOptimisticCart({ type: "add", item: optimisticItem });
      });

      try {
        setError(null);

        await apiClient.post("/api/cart", {
          menuItemId,
          quantity,
          ...options,
        });

        // Refresh cart to get accurate data from server
        await fetchCart();
      } catch (err) {
        // Revert optimistic update on error
        await fetchCart();

        const errorMessage =
          err instanceof Error ? err.message : "Failed to add item to cart";
        setError(errorMessage);
        console.error("Failed to add item to cart:", err);
        throw err;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, fetchCart],
  );

  // Remove item from cart
  const removeFromCart = useCallback(
    async (cartItemId: string) => {
      if (status !== "authenticated") {
        throw new Error("Please sign in to modify cart");
      }

      // Apply optimistic update immediately
      startTransition(() => {
        setOptimisticCart({ type: "remove", itemId: cartItemId });
      });

      try {
        setError(null);

        await apiClient.delete(`/api/cart/${cartItemId}`);

        // Refresh cart after removing
        await fetchCart();
      } catch (err) {
        // Revert optimistic update on error
        await fetchCart();

        const errorMessage =
          err instanceof Error ? err.message : "Failed to remove item";
        setError(errorMessage);
        console.error("Failed to remove item from cart:", err);
        throw err;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, fetchCart],
  );

  // Update item quantity
  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      if (status !== "authenticated") {
        throw new Error("Please sign in to modify cart");
      }

      // Apply optimistic update immediately
      startTransition(() => {
        setOptimisticCart({ type: "update", itemId: cartItemId, quantity });
      });

      try {
        setError(null);

        await apiClient.patch(`/api/cart/${cartItemId}`, { quantity });

        // Refresh cart after updating
        await fetchCart();
      } catch (err) {
        // Revert optimistic update on error
        await fetchCart();

        const errorMessage =
          err instanceof Error ? err.message : "Failed to update quantity";
        setError(errorMessage);
        console.error("Failed to update quantity:", err);
        throw err;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, fetchCart],
  );

  // Clear entire cart
  const clearCart = useCallback(async () => {
    if (status !== "authenticated") {
      throw new Error("Please sign in to modify cart");
    }

    // Apply optimistic update immediately
    startTransition(() => {
      setOptimisticCart({ type: "clear" });
    });

    try {
      setError(null);

      await apiClient.delete("/api/cart");

      startTransition(() => {
        setCart(null);
      });
      await fetchCart();
    } catch (err) {
      // Revert optimistic update on error
      await fetchCart();

      const errorMessage =
        err instanceof Error ? err.message : "Failed to clear cart";
      setError(errorMessage);
      console.error("Failed to clear cart:", err);
      throw err;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, fetchCart]);

  // Calculate item count from optimistic cart
  const itemCount =
    optimisticCart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Calculate total from optimistic cart
  const total =
    optimisticCart?.items.reduce((sum, item) => sum + item.price, 0) || 0;

  return {
    cart: optimisticCart,
    loading,
    error,
    isUpdating: isPending,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart: fetchCart,
    itemCount,
    total,
  };
}
