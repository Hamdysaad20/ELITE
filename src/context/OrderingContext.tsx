"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

type OrderingContextValue = {
  orderingEnabled: boolean;
  orderingMessage?: string;
  loading: boolean;
  refresh: () => void;
};

const OrderingContext = createContext<OrderingContextValue>({
  orderingEnabled: true,
  orderingMessage: undefined,
  loading: true,
  refresh: () => {},
});

type OrderingProviderProps = {
  children: React.ReactNode;
  /** Skip the automatic fetch on mount (e.g. landing page doesn't need it) */
  lazy?: boolean;
};

export function OrderingProvider({
  children,
  lazy = false,
}: OrderingProviderProps) {
  const [orderingEnabled, setOrderingEnabled] = React.useState(true);
  const [orderingMessage, setOrderingMessage] = React.useState<
    string | undefined
  >(undefined);
  const [loading, setLoading] = React.useState(!lazy);
  const hasFetched = useRef(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    hasFetched.current = true;
    try {
      const res = await fetch("/api/checkout/config", {
        credentials: "include",
      });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const json = await res.json();
      const data = (json?.data || json) as {
        orderingEnabled?: boolean;
        orderingMessage?: string;
      };

      if (typeof data.orderingEnabled === "boolean") {
        setOrderingEnabled(data.orderingEnabled);
      } else {
        setOrderingEnabled(true);
      }
      if (typeof data.orderingMessage === "string" && data.orderingMessage) {
        setOrderingMessage(data.orderingMessage);
      } else {
        setOrderingMessage(undefined);
      }
    } catch {
      setOrderingEnabled(true);
      setOrderingMessage(undefined);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!lazy) {
      loadConfig();
    }
  }, [loadConfig, lazy]);

  return (
    <OrderingContext.Provider
      value={{ orderingEnabled, orderingMessage, loading, refresh: loadConfig }}
    >
      {children}
    </OrderingContext.Provider>
  );
}

export function useOrdering() {
  return useContext(OrderingContext);
}
