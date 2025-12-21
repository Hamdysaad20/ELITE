"use client";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "shimmer" | "pulse";
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
}

// Detect if device prefers reduced motion or is low-end
function useAdaptiveAnimation() {
  const [isLowEnd, setIsLowEnd] = useState(false);
  
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Check for low-end device hints
    const isSlowConnection = (navigator as any).connection?.effectiveType === "2g" || 
                             (navigator as any).connection?.effectiveType === "slow-2g";
    const hasLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;
    
    setIsLowEnd(prefersReduced || isSlowConnection || hasLowMemory);
  }, []);
  
  return isLowEnd;
}

export function Skeleton({ 
  className = "", 
  variant = "shimmer",
  rounded = "md" 
}: SkeletonProps) {
  const isLowEnd = useAdaptiveAnimation();
  
  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-lg",
    lg: "rounded-xl",
    xl: "rounded-2xl",
    full: "rounded-full",
  };
  
  // Use simple pulse for low-end devices, shimmer for others
  const effectiveVariant = isLowEnd ? "pulse" : variant;
  
  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-elite-dark-cream/60",
        roundedClasses[rounded],
        effectiveVariant === "pulse" && "animate-pulse",
        className
      )}
    >
      {/* Shimmer effect overlay - only for non-low-end devices */}
      {effectiveVariant === "shimmer" && (
        <div 
          className="absolute inset-0 -translate-x-full animate-shimmer"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
          }}
        />
      )}
    </div>
  );
}

export function SkeletonText({ 
  lines = 3, 
  className = "",
  lastLineWidth = "w-2/3"
}: { 
  lines?: number; 
  className?: string;
  lastLineWidth?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            "h-3",
            i === lines - 1 ? lastLineWidth : "w-full"
          )} 
          rounded="sm"
        />
      ))}
    </div>
  );
}

export function SkeletonCircle({ 
  size = "md",
  className = "" 
}: { 
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  };
  
  return (
    <Skeleton 
      className={cn(sizeClasses[size], className)} 
      rounded="full" 
    />
  );
}

export function SkeletonCard({ 
  className = "",
  imageHeight = "h-48"
}: { 
  className?: string;
  imageHeight?: string;
}) {
  return (
    <div className={cn("bg-white rounded-2xl overflow-hidden shadow-md", className)}>
      <Skeleton className={cn("w-full", imageHeight)} rounded="none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" rounded="md" />
        <SkeletonText lines={2} lastLineWidth="w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20" rounded="md" />
          <SkeletonCircle size="sm" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonButton({ 
  className = "",
  size = "md"
}: { 
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-8 w-20",
    md: "h-10 w-28",
    lg: "h-12 w-36",
  };
  
  return (
    <Skeleton 
      className={cn(sizeClasses[size], className)} 
      rounded="full" 
    />
  );
}

export function SkeletonAvatar({ 
  className = "",
  size = "md",
  withText = false
}: { 
  className?: string;
  size?: "sm" | "md" | "lg";
  withText?: boolean;
}) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Skeleton className={sizeClasses[size]} rounded="full" />
      {withText && (
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" rounded="sm" />
          <Skeleton className="h-3 w-32" rounded="sm" />
        </div>
      )}
    </div>
  );
}
