"use client";

import { useState, useEffect } from "react";

export interface LocalCartItem {
  id: string; // Unique cart item ID
  productId: string; // Odoo product ID
  name: string; // Product name
  basePrice: number; // Base product price
  quantity: number;
  attributes: {
    [attributeName: string]: {
      valueId: number;
      valueName: string;
      priceExtra: number;
    }[];
  };
  totalPrice: number; // (basePrice + sum(priceExtra)) * quantity
  image?: string; // First product image
}

const STORAGE_KEY = "elite_cart";
const EVENT_KEY = "elite_cart_updated";

// Simple UUID generator
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Generate unique key for cart item (product + attributes combination)
const getItemKey = (
  productId: string,
  attributes: LocalCartItem["attributes"],
): string => {
  const sortedAttrs = JSON.stringify(
    Object.entries(attributes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, v.sort((a, b) => a.valueId - b.valueId)]),
  );
  return `${productId}-${sortedAttrs}`;
};

export function useLocalCart() {
  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage
  const loadCart = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setItems(Array.isArray(parsed) ? parsed : []);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and event listeners
  useEffect(() => {
    loadCart();

    const handleStorageChange = () => loadCart();

    window.addEventListener(EVENT_KEY, handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(EVENT_KEY, handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Helper to save cart and notify others
  const saveCart = (newItems: LocalCartItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      window.dispatchEvent(new Event(EVENT_KEY));
      setItems(newItems);
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  };

  // Add item to cart
  const addItem = (newItem: Omit<LocalCartItem, "id">): void => {
    // Read latest state from localStorage to ensure we have the most up-to-date list
    let currentItems: LocalCartItem[] = [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) currentItems = JSON.parse(saved);
    } catch (e) {
      currentItems = items; // Fallback to state
    }

    const itemKey = getItemKey(newItem.productId, newItem.attributes);

    // Check if identical item exists (same product + same attributes)
    const existingIndex = currentItems.findIndex(
      (item) => getItemKey(item.productId, item.attributes) === itemKey,
    );

    let updatedItems;
    if (existingIndex > -1) {
      // Update quantity of existing item
      updatedItems = [...currentItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + newItem.quantity,
        totalPrice: updatedItems[existingIndex].totalPrice + newItem.totalPrice,
      };
    } else {
      // Add new item
      updatedItems = [...currentItems, { ...newItem, id: generateId() }];
    }

    saveCart(updatedItems);
  };

  // Remove item from cart
  const removeItem = (itemId: string): void => {
    let currentItems: LocalCartItem[] = [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) currentItems = JSON.parse(saved);
    } catch (e) {
      currentItems = items;
    }

    const updatedItems = currentItems.filter((item) => item.id !== itemId);
    saveCart(updatedItems);
  };

  // Update item quantity
  const updateQuantity = (itemId: string, quantity: number): void => {
    if (quantity < 1) {
      removeItem(itemId);
      return;
    }

    let currentItems: LocalCartItem[] = [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) currentItems = JSON.parse(saved);
    } catch (e) {
      currentItems = items;
    }

    const updatedItems = currentItems.map((item) => {
      if (item.id === itemId) {
        // Recalculate total price based on new quantity
        const pricePerUnit = item.totalPrice / item.quantity;
        return {
          ...item,
          quantity,
          totalPrice: pricePerUnit * quantity,
        };
      }
      return item;
    });

    saveCart(updatedItems);
  };

  // Clear entire cart
  const clearCart = (): void => {
    saveCart([]);
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  // Online checkout pricing: customers pay the item price as-is (no added tax line in UI).
  const tax = 0;
  const total = subtotal;

  return {
    items,
    isLoading,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    itemCount,
    tax,
    total,
  };
}
