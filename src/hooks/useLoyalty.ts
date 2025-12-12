"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/auth/apiClient";
import { useSession } from "next-auth/react";

export interface LoyaltyAccount {
  coins: number;
  lifetimeCoins: number;
  totalSpent: number;
  tier: string;
  tierMultiplier: number;
  updatedAt: Date;
}

export interface LoyaltyActivity {
  id: string;
  deltaCoins: number;
  reason: string | null;
  source: string;
  orderId: string | null;
  orderTotal?: number;
  createdAt: Date;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  multiplier: number;
  monthlyRequirements: {
    coinsEarned: number;
    purchases: number;
    challenges?: number;
    eliteChallenges?: number;
    streakDays: number;
  };
  benefits: string[];
  color: string;
  icon: string;
}

export interface LoyaltyData {
  account: LoyaltyAccount;
  recentActivity: LoyaltyActivity[];
  tiers: {
    current: LoyaltyTier;
    next: LoyaltyTier | null;
    all: LoyaltyTier[];
    progress: number;
  };
}

interface UseLoyaltyReturn {
  loyalty: LoyaltyData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch user's loyalty information
 * 
 * @example
 * ```tsx
 * const { loyalty, loading, error } = useLoyalty();
 * 
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error} />;
 * 
 * return (
 *   <div>
 *     <p>Coins: {loyalty.account.coins}</p>
 *     <p>Tier: {loyalty.account.tier}</p>
 *   </div>
 * );
 * ```
 */
export function useLoyalty(): UseLoyaltyReturn {
  const { data: session, status } = useSession();
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoyalty = useCallback(async () => {
    // Don't fetch if not authenticated
    if (status !== "authenticated") {
      setLoyalty(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<LoyaltyData>("/api/loyalty");
      setLoyalty(response);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load loyalty information");
      }
      console.error("Failed to fetch loyalty:", err);
      setLoyalty(null);
    } finally {
      setLoading(false);
    }
  }, [status]);

  // Fetch loyalty when session is ready
  useEffect(() => {
    if (status !== "loading") {
      fetchLoyalty();
    }
  }, [status, fetchLoyalty]);

  return {
    loyalty,
    loading,
    error,
    refetch: fetchLoyalty,
  };
}


