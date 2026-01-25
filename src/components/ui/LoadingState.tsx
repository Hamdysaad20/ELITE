"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface LoadingStateProps {
  message?: string;
  variant?: "spinner" | "skeleton" | "dots";
  size?: "small" | "medium" | "large";
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingState({
  message,
  variant = "spinner",
  size = "medium",
  fullScreen = false,
  className,
}: LoadingStateProps) {
  const t = useTranslations("loadingState");
  const resolvedMessage = message ?? t("loading");
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  const containerClasses = cn(
    "flex flex-col items-center justify-center gap-4",
    fullScreen ? "min-h-screen" : "py-12",
    className,
  );

  if (variant === "spinner") {
    return (
      <div className={containerClasses}>
        <Loader2
          className={cn("animate-spin text-elite-burgundy", sizeClasses[size])}
        />
        {resolvedMessage && (
          <p className="text-elite-black/70 font-cabin text-sm md:text-base">
            {resolvedMessage}
          </p>
        )}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={containerClasses}>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "rounded-full bg-elite-burgundy animate-pulse",
                size === "small" && "w-2 h-2",
                size === "medium" && "w-3 h-3",
                size === "large" && "w-4 h-4",
              )}
              style={{
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
        {resolvedMessage && (
          <p className="text-elite-black/70 font-cabin text-sm md:text-base">
            {resolvedMessage}
          </p>
        )}
      </div>
    );
  }

  // Skeleton variant
  return (
    <div className={containerClasses}>
      <div className="w-full max-w-md space-y-4 animate-pulse">
        <div className="h-4 bg-elite-dark-cream rounded"></div>
        <div className="h-4 bg-elite-dark-cream rounded w-3/4"></div>
        <div className="h-4 bg-elite-dark-cream rounded w-1/2"></div>
      </div>
    </div>
  );
}
