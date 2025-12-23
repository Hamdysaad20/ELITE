"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "../Skeleton";

interface ProductCardSkeletonProps {
  className?: string;
  size?: "small" | "medium" | "large";
}

export default function ProductCardSkeleton({
  className,
  size = "medium",
}: ProductCardSkeletonProps) {
  const sizeClasses = {
    small: "h-48 sm:h-52",
    medium: "h-56 sm:h-64",
    large: "h-64 sm:h-72",
  };

  return (
    <div
      className={cn(
        "relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-elite-burgundy/5",
        className
      )}
    >
      {/* Image skeleton with inner padding like real cards */}
      <div className="p-3 sm:p-4">
        <Skeleton 
          className={cn("w-full rounded-2xl", sizeClasses[size])} 
          variant="shimmer"
          rounded="xl"
        />
      </div>

      {/* Content skeleton */}
      <div className="px-4 sm:px-6 pb-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-6 sm:h-7 w-4/5" rounded="lg" />

        {/* Price */}
        <Skeleton className="h-7 sm:h-8 w-28" rounded="lg" />

        {/* Buttons row */}
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-11 w-20 flex-shrink-0" rounded="full" />
          <Skeleton className="h-11 flex-1" rounded="full" />
        </div>
      </div>
    </div>
  );
}
