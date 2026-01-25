/**
 * Loading skeleton components for better perceived performance
 */
"use client";

import React from "react";
import { cn, loadingStates } from "@/lib/componentUtils";
import { useTranslations } from "next-intl";

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Basic skeleton loader component
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className, children }) => {
  return (
    <div className={cn(loadingStates.skeleton, "h-4 w-full", className)}>
      {children}
    </div>
  );
};

/**
 * Card skeleton for menu items and components
 */
export const CardSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
};

/**
 * List skeleton for multiple items
 */
export const ListSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 3, className }) => {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Loading spinner component
 */
export const Spinner: React.FC<{
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ size = "md", className }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={cn(loadingStates.spinner, sizeClasses[size], className)} />
  );
};

/**
 * Full page loading component
 */
export const PageLoader: React.FC<{ message?: string }> = ({
  message,
}) => {
  const t = useTranslations("loadingState");
  const resolvedMessage = message ?? t("loading");
  return (
    <div className="min-h-screen flex items-center justify-center bg-elite-cream">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-elite-gray font-medium">{resolvedMessage}</p>
      </div>
    </div>
  );
};

/**
 * Loading overlay for components
 */
export const LoadingOverlay: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  message?: string;
}> = ({ loading, children, message }) => {
  const t = useTranslations("loadingState");
  const resolvedMessage = message ?? t("loading");
  if (!loading) return <>{children}</>;

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80">
        <div className="text-center">
          <Spinner className="mx-auto mb-2" />
          <p className="text-sm text-elite-gray">{resolvedMessage}</p>
        </div>
      </div>
    </div>
  );
};
