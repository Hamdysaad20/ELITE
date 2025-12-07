"use client";

import { cn } from "@/lib/utils";

interface ProductCardSkeletonProps {
  className?: string;
  size?: "small" | "medium" | "large";
}

export default function ProductCardSkeleton({
  className,
  size = "medium",
}: ProductCardSkeletonProps) {
  const sizeClasses = {
    small: "h-52",
    medium: "h-60",
    large: "h-68",
  };

  return (
    <div
      className={cn(
        "relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-md",
        "animate-pulse",
        className
      )}
    >
      {/* Image skeleton */}
      <div className={cn("w-full bg-elite-dark-cream", sizeClasses[size])} />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-5 bg-elite-dark-cream rounded w-3/4" />

        {/* Description */}
        <div className="space-y-2">
          <div className="h-3 bg-elite-dark-cream rounded w-full" />
          <div className="h-3 bg-elite-dark-cream rounded w-2/3" />
        </div>

        {/* Price and button */}
        <div className="flex items-center justify-between pt-2">
          <div className="h-6 bg-elite-dark-cream rounded w-20" />
          <div className="h-10 w-10 bg-elite-dark-cream rounded-full" />
        </div>
      </div>

      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}
