"use client";

import { useState, useEffect } from "react";

export interface LocalCartItem {
  id: string;           // Unique cart item ID
  productId: string;    // Odoo product ID
  name: string;         // Product name
  basePrice: number;    // Base product price
  quantity: number;
  attributes: {
    [attributeName: string]: {
      valueId: number;
      valueName: string;
      priceExtra: number;
    }[];
  };
  totalPrice: number;   // (basePrice + sum(priceExtra)) * quantity
  image?: string;       // First product image
}

const STORAGE_KEY = 'elite_cart';

// Simple UUID generator
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useLocalCart() {
  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setItems(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Persist to localStorage on changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [items, isLoading]);

  // Generate unique key for cart item (product + attributes combination)
  const getItemKey = (productId: string, attributes: LocalCartItem['attributes']): string => {
    const sortedAttrs = JSON.stringify(
      Object.entries(attributes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, v.sort((a, b) => a.valueId - b.valueId)])
    );
    return `${productId}-${sortedAttrs}`;
  };

  // Add item to cart
  const addItem = (newItem: Omit<LocalCartItem, 'id'>): void => {
    setItems((currentItems) => {
      const itemKey = getItemKey(newItem.productId, newItem.attributes);
      
      // Check if identical item exists (same product + same attributes)
      const existingIndex = currentItems.findIndex(item => 
        getItemKey(item.productId, item.attributes) === itemKey
      );

      if (existingIndex > -1) {
        // Update quantity of existing item
        const updated = [...currentItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
          totalPrice: updated[existingIndex].totalPrice + newItem.totalPrice,
        };
        return updated;
      } else {
        // Add new item
        return [...currentItems, { ...newItem, id: generateId() }];
      }
    });
  };

  // Remove item from cart
  const removeItem = (itemId: string): void => {
    setItems((currentItems) => currentItems.filter(item => item.id !== itemId));
  };

  // Update item quantity
  const updateQuantity = (itemId: string, quantity: number): void => {
    if (quantity < 1) {
      removeItem(itemId);
      return;
    }

    setItems((currentItems) => {
      return currentItems.map(item => {
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
    });
  };

  // Clear entire cart
  const clearCart = (): void => {
    setItems([]);
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const tax = subtotal * 0.14; // 14% tax
  const total = subtotal + tax;

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
