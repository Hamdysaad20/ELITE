"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "../Skeleton";

interface CategoryPillSkeletonProps {
  className?: string;
  count?: number;
}

export default function CategoryPillSkeleton({
  className,
  count = 5,
}: CategoryPillSkeletonProps) {
  // Generate varied widths for natural look
  const widths = ["w-20", "w-28", "w-24", "w-32", "w-26"];

  return (
    <div
      className={cn(
        "flex gap-2.5 py-3 overflow-x-auto scrollbar-hide -mx-4 px-4",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-11 flex-shrink-0", widths[index % widths.length])}
          rounded="full"
          variant="shimmer"
        />
      ))}
    </div>
  );
}
