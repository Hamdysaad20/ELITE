"use client";

import { cn } from "@/lib/utils";

interface CategoryPillSkeletonProps {
  className?: string;
  count?: number;
}

export default function CategoryPillSkeleton({
  className,
  count = 5,
}: CategoryPillSkeletonProps) {
  // Generate random widths for variety
  const widths = ["w-24", "w-32", "w-28", "w-36", "w-20"];

  return (
    <div className={cn("flex gap-3 py-4 px-2", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "relative h-12 bg-elite-dark-cream rounded-xl animate-pulse overflow-hidden",
            widths[index % widths.length]
          )}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      ))}
    </div>
  );
}
