import { useState, useEffect } from "react";

interface UserSavings {
  totalSaved: number;
  totalOrders: number;
  averageSavingsPerOrder: number;
  savingsByMonth: { month: string; amount: number }[];
}

interface PointsTransaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  reason: string;
  createdAt: Date | string;
}

interface UserPoints {
  totalPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  tier: string;
  nextTierAt: number;
  pointsToNextTier: number;
  recentTransactions?: PointsTransaction[];
}

export function useUserSavings() {
  const [savings, setSavings] = useState<UserSavings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSavings() {
      try {
        setLoading(true);
        const response = await fetch("/api/user/savings");

        if (!response.ok) {
          throw new Error("Failed to fetch savings");
        }

        const data = await response.json();
        setSavings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchSavings();
  }, []);

  return { savings, loading, error };
}

export function useUserPoints() {
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPoints() {
      try {
        setLoading(true);
        const response = await fetch("/api/user/points");

        if (!response.ok) {
          throw new Error("Failed to fetch points");
        }

        const data = await response.json();
        setPoints(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchPoints();
  }, []);

  return { points, loading, error };
}

export function usePointsHistory(limit: number = 20) {
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const response = await fetch(`/api/user/points/history?limit=${limit}`);

        if (!response.ok) {
          throw new Error("Failed to fetch points history");
        }

        const data = await response.json();
        setTransactions(data.transactions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [limit]);

  return { transactions, loading, error };
}
