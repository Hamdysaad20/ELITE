"use client";

import { useState, useCallback, useTransition } from "react";

interface OptimisticState<T> {
  data: T;
  isOptimistic: boolean;
  isPending: boolean;
}

interface UseOptimisticOptions<T> {
  initialData: T;
  onUpdate?: (newData: T) => Promise<void>;
  onError?: (error: Error, rollbackData: T) => void;
}

/**
 * useOptimistic - A hook for optimistic UI updates
 * 
 * Provides instant UI feedback while async operations complete in the background.
 * Automatically handles rollback on error.
 * 
 * @example
 * const { data, update, isOptimistic } = useOptimistic({
 *   initialData: cart,
 *   onUpdate: async (newCart) => await saveCart(newCart),
 * });
 */
export function useOptimistic<T>({ 
  initialData, 
  onUpdate, 
  onError 
}: UseOptimisticOptions<T>) {
  const [data, setData] = useState<T>(initialData);
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isOptimistic, setIsOptimistic] = useState(false);

  const update = useCallback(async (newData: T) => {
    const previousData = data;
    
    // Apply optimistic update immediately
    setOptimisticData(newData);
    setIsOptimistic(true);
    
    startTransition(async () => {
      try {
        if (onUpdate) {
          await onUpdate(newData);
        }
        // Confirm the update
        setData(newData);
        setOptimisticData(null);
        setIsOptimistic(false);
      } catch (error) {
        // Rollback on error
        setOptimisticData(null);
        setIsOptimistic(false);
        if (onError) {
          onError(error as Error, previousData);
        }
      }
    });
  }, [data, onUpdate, onError]);

  const currentData = optimisticData ?? data;

  return {
    data: currentData,
    actualData: data,
    isOptimistic,
    isPending,
    update,
    reset: () => {
      setOptimisticData(null);
      setIsOptimistic(false);
    }
  };
}

/**
 * useOptimisticAction - Simplified hook for optimistic action feedback
 * 
 * Perfect for buttons, toggles, and single actions.
 */
export function useOptimisticAction() {
  const [state, setState] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [isPending, startTransition] = useTransition();

  const execute = useCallback(async <T>(
    action: () => Promise<T>,
    options?: {
      successDuration?: number;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    }
  ) => {
    setState('pending');
    
    startTransition(async () => {
      try {
        const result = await action();
        setState('success');
        options?.onSuccess?.(result);
        
        // Reset to idle after success duration
        setTimeout(() => {
          setState('idle');
        }, options?.successDuration ?? 2000);
      } catch (error) {
        setState('error');
        options?.onError?.(error as Error);
        
        // Reset to idle after error display
        setTimeout(() => {
          setState('idle');
        }, 3000);
      }
    });
  }, []);

  return {
    state,
    isPending: state === 'pending' || isPending,
    isSuccess: state === 'success',
    isError: state === 'error',
    isIdle: state === 'idle',
    execute,
    reset: () => setState('idle'),
  };
}

/**
 * useOptimisticList - Hook for optimistic list operations
 * 
 * Handles add, remove, update operations with instant feedback.
 */
export function useOptimisticList<T extends { id: string | number }>(
  initialItems: T[],
  options?: {
    onAdd?: (item: T) => Promise<void>;
    onRemove?: (id: string | number) => Promise<void>;
    onUpdate?: (item: T) => Promise<void>;
    onError?: (error: Error, action: string) => void;
  }
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [pendingIds, setPendingIds] = useState<Set<string | number>>(new Set());
  const [isPending, startTransition] = useTransition();

  const addItem = useCallback(async (newItem: T) => {
    // Optimistically add
    setItems(prev => [...prev, newItem]);
    setPendingIds(prev => new Set([...prev, newItem.id]));

    startTransition(async () => {
      try {
        await options?.onAdd?.(newItem);
        setPendingIds(prev => {
          const next = new Set(prev);
          next.delete(newItem.id);
          return next;
        });
      } catch (error) {
        // Rollback
        setItems(prev => prev.filter(item => item.id !== newItem.id));
        setPendingIds(prev => {
          const next = new Set(prev);
          next.delete(newItem.id);
          return next;
        });
        options?.onError?.(error as Error, 'add');
      }
    });
  }, [options]);

  const removeItem = useCallback(async (id: string | number) => {
    const itemToRemove = items.find(item => item.id === id);
    if (!itemToRemove) return;

    // Optimistically remove
    setItems(prev => prev.filter(item => item.id !== id));
    setPendingIds(prev => new Set([...prev, id]));

    startTransition(async () => {
      try {
        await options?.onRemove?.(id);
        setPendingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } catch (error) {
        // Rollback
        setItems(prev => [...prev, itemToRemove]);
        setPendingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        options?.onError?.(error as Error, 'remove');
      }
    });
  }, [items, options]);

  const updateItem = useCallback(async (updatedItem: T) => {
    const originalItem = items.find(item => item.id === updatedItem.id);
    if (!originalItem) return;

    // Optimistically update
    setItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
    setPendingIds(prev => new Set([...prev, updatedItem.id]));

    startTransition(async () => {
      try {
        await options?.onUpdate?.(updatedItem);
        setPendingIds(prev => {
          const next = new Set(prev);
          next.delete(updatedItem.id);
          return next;
        });
      } catch (error) {
        // Rollback
        setItems(prev => prev.map(item => 
          item.id === updatedItem.id ? originalItem : item
        ));
        setPendingIds(prev => {
          const next = new Set(prev);
          next.delete(updatedItem.id);
          return next;
        });
        options?.onError?.(error as Error, 'update');
      }
    });
  }, [items, options]);

  return {
    items,
    isPending,
    pendingIds,
    isItemPending: (id: string | number) => pendingIds.has(id),
    addItem,
    removeItem,
    updateItem,
    setItems,
  };
}

