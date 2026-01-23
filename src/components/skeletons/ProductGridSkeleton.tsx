"use client";

import { cn } from "@/lib/utils";
import ProductCardSkeleton from "./ProductCardSkeleton";

interface ProductGridSkeletonProps {
  count?: number;
  className?: string;
  columns?: 2 | 3 | 4;
}

export default function ProductGridSkeleton({
  count = 6,
  className,
  columns = 4,
}: ProductGridSkeletonProps) {
  const columnClasses = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  };

  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-4 lg:gap-5",
        columnClasses[columns],
        className,
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} style={{ animationDelay: `${index * 50}ms` }}>
          <ProductCardSkeleton size="small" />
        </div>
      ))}
    </div>
  );
}
