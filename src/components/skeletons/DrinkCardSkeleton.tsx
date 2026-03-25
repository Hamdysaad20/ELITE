import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DrinkCardSkeletonProps {
  size?: "small" | "medium" | "large";
}

export function DrinkCardSkeleton({ size = "medium" }: DrinkCardSkeletonProps) {
  const sizeClasses = {
    small: {
      image: "h-40 sm:h-52",
      padding: "p-2 sm:p-2.5",
      contentPadding: "px-2.5 sm:px-3 pb-2.5 sm:pb-3",
    },
    medium: {
      image: "h-36 sm:h-44",
      padding: "p-2.5 sm:p-3",
      contentPadding: "px-3 sm:px-4 pb-3 sm:pb-4",
    },
    large: {
      image: "h-40 sm:h-52",
      padding: "p-3 sm:p-4",
      contentPadding: "px-4 sm:px-6 pb-4 sm:pb-5",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "bg-white rounded-2xl sm:rounded-3xl overflow-hidden h-full flex flex-col",
        "shadow-[0_2px_8px_rgba(139,0,0,0.08)]",
        "border border-elite-burgundy/10",
      )}
    >
      {/* Image Container Skeleton */}
      <div className={cn("relative", sizes.padding)}>
        <Skeleton
          className={cn("w-full rounded-xl sm:rounded-2xl", sizes.image)}
        />
      </div>

      {/* Content Skeleton */}
      <div className={cn("flex-1 flex flex-col", sizes.contentPadding)}>
        {/* Title */}
        <Skeleton className="h-5 sm:h-6 w-3/4 mb-2" />
        <Skeleton className="h-5 sm:h-6 w-1/2 mb-4" />

        {/* Price */}
        <Skeleton className="h-6 sm:h-8 w-24 mb-4" />

        {/* Button */}
        <div className="mt-auto pt-3 sm:pt-4">
          <Skeleton className="h-[44px] sm:h-[48px] w-full rounded-xl sm:rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
