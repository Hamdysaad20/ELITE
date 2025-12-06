"use client";

import { useState } from "react";
import { Star, CheckCircle, ThumbsUp } from "lucide-react";
import { Review } from "@/hooks/useReviews";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
            {review.user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 font-cabin">{review.user.name}</p>
              {review.verified && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-cabin">
              {new Date(review.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Rating Stars */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= review.rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-gray-700 text-sm mb-3 font-cabin leading-relaxed">
          {review.comment}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
        <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-amber-600 transition-colors">
          <ThumbsUp className="w-3 h-3" />
          <span className="font-cabin">Helpful ({review.helpful})</span>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert("Please select a rating");
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
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-calistoga text-xl text-gray-900 mb-4">Write a Review</h3>

      {/* Rating Stars */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2 font-cabin">
          Your Rating
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoverRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-600 font-cabin">
              {rating === 5 && "Excellent!"}
              {rating === 4 && "Very Good"}
              {rating === 3 && "Good"}
              {rating === 2 && "Fair"}
              {rating === 1 && "Poor"}
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2 font-cabin">
          Your Review (Optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={1000}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none font-cabin"
          placeholder="Share your experience with this product..."
        />
        <p className="text-xs text-gray-500 mt-1 font-cabin">
          {comment.length}/1000 characters
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 px-6 rounded-lg font-cabin font-semibold hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {submitting ? "Submitting..." : "Submit Review"}
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
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-cabin mb-1">Average Rating</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-gray-900 font-calistoga">
              {stats.averageRating.toFixed(1)}
            </p>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(stats.averageRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 font-cabin mb-1">Total Reviews</p>
          <p className="text-3xl font-bold text-gray-900 font-calistoga">{stats.total}</p>
        </div>
      </div>
    </div>
  );
}

