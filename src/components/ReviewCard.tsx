"use client";

import { useState } from "react";
import { Star, CheckCircle, ThumbsUp } from "lucide-react";
import { Review } from "@/hooks/useReviews";
import { useToast } from "@/components/ToastProvider";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-elite-burgundy/10 p-4 sm:p-5 lg:p-6 hover:shadow-xl hover:border-elite-burgundy/20 transition-all duration-300 active:scale-[0.99] touch-manipulation w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-elite-burgundy flex items-center justify-center text-elite-cream font-semibold text-sm sm:text-base shadow-lg flex-shrink-0">
            {review.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-elite-black font-cabin text-sm sm:text-base truncate">{review.user.name}</p>
              {review.verified && (
                <span className="inline-flex items-center gap-1 bg-elite-burgundy/10 text-elite-burgundy text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-elite-burgundy/20 flex-shrink-0">
                  <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Verified Purchase</span>
                  <span className="sm:hidden">Verified</span>
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-elite-black/60 font-cabin mt-0.5 sm:mt-1">
              {new Date(review.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Rating Stars */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${
                star <= review.rating
                  ? "fill-elite-burgundy text-elite-burgundy"
                  : "text-elite-burgundy/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-elite-black/80 text-xs sm:text-sm lg:text-base mb-3 sm:mb-4 font-cabin leading-relaxed break-words">
          {review.comment}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-elite-burgundy/10">
        <button className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-elite-burgundy/70 hover:text-elite-burgundy hover:bg-elite-burgundy/5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 active:scale-95 touch-manipulation">
          <ThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="font-cabin font-medium">Helpful ({review.helpful})</span>
        </button>
      </div>
    </div>
  );
}

interface ReviewFormProps {
  productId: string;
  productName: string;
  onSubmit: (rating: number, comment?: string) => Promise<void>;
  submitting: boolean;
}

export function ReviewForm({ productId, productName, onSubmit, submitting }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const { error: toastError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toastError("Please select a rating");
      return;
    }

    try {
      await onSubmit(rating, comment || undefined);
      // Reset form
      setRating(0);
      setComment("");
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rating Stars */}
      <div>
        <label className="block text-sm font-semibold text-elite-black mb-3 font-cabin">
          Rate this product
        </label>
        <div className="flex items-center gap-3 flex-wrap">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation"
            >
              <Star
                className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors ${
                  star <= (hoverRating || rating)
                    ? "fill-elite-burgundy text-elite-burgundy"
                    : "text-elite-burgundy/20 hover:text-elite-burgundy/40"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm sm:text-base font-semibold text-elite-burgundy font-cabin px-4 py-2 bg-elite-burgundy/10 rounded-full border border-elite-burgundy/20">
              {rating === 5 && "⭐ Excellent!"}
              {rating === 4 && "👍 Very Good"}
              {rating === 3 && "😊 Good"}
              {rating === 2 && "😐 Fair"}
              {rating === 1 && "😞 Poor"}
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="comment" className="block text-sm font-semibold text-elite-black mb-3 font-cabin">
          Share your experience (Optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={1000}
          className="w-full px-5 py-4 border-2 border-elite-burgundy/20 rounded-2xl focus:ring-2 focus:ring-elite-burgundy focus:border-elite-burgundy resize-none font-cabin text-elite-black placeholder:text-elite-black/40 transition-all duration-200"
          placeholder="Tell us what you think about this product..."
        />
        <p className="text-xs text-elite-black/60 mt-2 font-cabin">
          {comment.length}/1000 characters
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="w-full bg-elite-burgundy text-elite-cream py-4 px-6 rounded-full font-cabin font-bold text-base hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-elite-burgundy disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 active:scale-95 touch-manipulation"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-elite-cream border-t-transparent"></div>
            Submitting...
          </span>
        ) : (
          "Submit Review"
        )}
      </button>
    </form>
  );
}

interface ReviewStatsProps {
  stats: {
    total: number;
    averageRating: number;
  };
}

export function ReviewStats({ stats }: ReviewStatsProps) {
  return (
    <div className="bg-gradient-to-br from-elite-cream to-elite-dark-cream rounded-3xl border-2 border-elite-burgundy/20 p-6 sm:p-8 shadow-lg">
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div>
          <p className="text-sm text-elite-black/70 font-cabin mb-2 font-semibold">Average Rating</p>
          <div className="flex items-baseline gap-3">
            <p className="text-5xl sm:text-6xl font-bold text-elite-burgundy font-calistoga">
              {stats.averageRating.toFixed(1)}
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(stats.averageRating)
                      ? "fill-elite-burgundy text-elite-burgundy"
                      : "text-elite-burgundy/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-elite-black/70 font-cabin mb-2 font-semibold">Total Reviews</p>
          <p className="text-4xl sm:text-5xl font-bold text-elite-burgundy font-calistoga">{stats.total}</p>
        </div>
      </div>
    </div>
  );
}

