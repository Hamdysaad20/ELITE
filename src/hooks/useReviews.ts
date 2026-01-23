"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/auth/apiClient";

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  helpful: number;
  verified: boolean;
  createdAt: Date;
  user: {
    name: string;
  };
}

export interface ReviewStats {
  total: number;
  averageRating: number;
}

interface UseReviewsOptions {
  productId: string;
  status?: string;
  limit?: number;
}

interface UseReviewsReturn {
  reviews: Review[];
  stats: ReviewStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  submitReview: (rating: number, comment?: string) => Promise<void>;
  submitting: boolean;
}

/**
 * Hook to fetch and manage product reviews
 *
 * @example
 * ```tsx
 * const { reviews, stats, submitReview, loading } = useReviews({
 *   productId: "latte"
 * });
 *
 * if (loading) return <Spinner />;
 *
 * return (
 *   <div>
 *     <p>Average: {stats.averageRating} stars</p>
 *     {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
 *     <button onClick={() => submitReview(5, "Great!")}>Submit</button>
 *   </div>
 * );
 * ```
 */
export function useReviews(options: UseReviewsOptions): UseReviewsReturn {
  const { productId, status = "approved", limit = 20 } = options;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("productId", productId);
      params.append("status", status);
      params.append("limit", String(limit));

      const response = await apiClient.get<{
        reviews: Review[];
        stats: ReviewStats;
      }>(`/api/reviews?${params.toString()}`);

      setReviews(response.reviews || []);
      setStats(response.stats || null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load reviews";
      setError(errorMessage);
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [productId, status, limit]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = useCallback(
    async (rating: number, comment?: string) => {
      try {
        setSubmitting(true);
        setError(null);

        await apiClient.post("/api/reviews", {
          productId,
          productName: productId, // Will be replaced with actual product name
          rating,
          comment,
        });

        // Refresh reviews after submission
        await fetchReviews();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to submit review";
        setError(errorMessage);
        console.error("Failed to submit review:", err);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [productId, fetchReviews],
  );

  return {
    reviews,
    stats,
    loading,
    error,
    refetch: fetchReviews,
    submitReview,
    submitting,
  };
}
