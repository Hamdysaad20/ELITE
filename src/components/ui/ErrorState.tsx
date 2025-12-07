"use client";

import { useState } from "react";
import { AlertCircle, RefreshCw, ChevronDown, WifiOff, ServerCrash, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  error: string | Error;
  onRetry?: () => void | Promise<void>;
  showDetails?: boolean;
  className?: string;
  size?: "small" | "medium" | "large";
}

export default function ErrorState({
  error,
  onRetry,
  showDetails = false,
  className,
  size = "medium",
}: ErrorStateProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetailsExpanded, setShowDetailsExpanded] = useState(false);

  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Determine error type and appropriate icon/message
  const getErrorType = () => {
    const msg = errorMessage.toLowerCase();
    if (msg.includes("network") || msg.includes("connection") || msg.includes("fetch")) {
      return {
        icon: WifiOff,
        title: "Connection Error",
        suggestion: "Please check your internet connection and try again.",
      };
    }
    if (msg.includes("timeout")) {
      return {
        icon: Clock,
        title: "Request Timeout",
        suggestion: "The request took too long. Please try again.",
      };
    }
    if (msg.includes("503") || msg.includes("synchroniz")) {
      return {
        icon: ServerCrash,
        title: "Service Temporarily Unavailable",
        suggestion: "Our system is updating. Please try again in a moment.",
      };
    }
    return {
      icon: AlertCircle,
      title: "Something Went Wrong",
      suggestion: "An unexpected error occurred. Please try again.",
    };
  };

  const errorType = getErrorType();
  const Icon = errorType.icon;

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (err) {
      console.error("Retry failed:", err);
    } finally {
      setIsRetrying(false);
    }
  };

  const sizeClasses = {
    small: {
      icon: "w-8 h-8",
      title: "text-base",
      text: "text-sm",
      padding: "p-4",
    },
    medium: {
      icon: "w-12 h-12",
      title: "text-xl",
      text: "text-base",
      padding: "p-8",
    },
    large: {
      icon: "w-16 h-16",
      title: "text-2xl",
      text: "text-lg",
      padding: "p-10",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn("flex flex-col items-center justify-center py-12", className)}>
      <div className={cn(
        "bg-red-50 border border-red-200 rounded-2xl max-w-md text-center",
        sizes.padding
      )}>
        <Icon className={cn("text-red-500 mx-auto mb-4", sizes.icon)} />
        
        <h3 className={cn("text-red-900 font-calistoga mb-2", sizes.title)}>
          {errorType.title}
        </h3>
        
        <p className={cn("text-red-700 font-cabin mb-1", sizes.text)}>
          {errorMessage}
        </p>
        
        {errorType.suggestion && (
          <p className={cn("text-red-600/80 font-cabin mb-4", sizes.text)}>
            {errorType.suggestion}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {onRetry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className={cn(
                "inline-flex items-center justify-center gap-2 bg-elite-burgundy text-elite-cream rounded-full font-cabin font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-elite-dark-burgundy",
                size === "small" && "px-4 py-2 text-sm",
                size === "medium" && "px-6 py-3 text-base",
                size === "large" && "px-8 py-4 text-lg"
              )}
            >
              <RefreshCw className={cn(
                isRetrying && "animate-spin",
                size === "small" && "w-3 h-3",
                size === "medium" && "w-4 h-4",
                size === "large" && "w-5 h-5"
              )} />
              {isRetrying ? "Retrying..." : "Try Again"}
            </button>
          )}

          {showDetails && errorStack && (
            <button
              onClick={() => setShowDetailsExpanded(!showDetailsExpanded)}
              className={cn(
                "inline-flex items-center justify-center gap-1 text-red-600 hover:text-red-800 font-cabin text-sm transition-colors",
                sizes.text
              )}
            >
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                showDetailsExpanded && "rotate-180"
              )} />
              {showDetailsExpanded ? "Hide" : "Show"} Details
            </button>
          )}
        </div>

        {showDetailsExpanded && errorStack && (
          <pre className="mt-4 p-3 bg-red-100 rounded-lg text-left text-xs text-red-900 overflow-x-auto font-mono">
            {errorStack}
          </pre>
        )}
      </div>
    </div>
  );
}
