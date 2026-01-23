"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

interface NetworkStatusProps {
  showWhenOnline?: boolean;
  className?: string;
}

/**
 * Network status indicator
 * Shows a banner when the user goes offline
 */
export default function NetworkStatus({
  showWhenOnline = false,
  className,
}: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Initialize with actual network status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);

      // Hide "back online" notification after 3 seconds
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Don't show if online and showWhenOnline is false
  if (isOnline && !showWhenOnline && !showNotification) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        showNotification ? "translate-y-0" : "-translate-y-full",
        className,
      )}
      role="alert"
      aria-live="polite"
    >
      <div
        className={cn(
          "flex items-center justify-center gap-2 px-4 py-2 text-sm font-cabin font-semibold shadow-lg",
          isOnline ? "bg-emerald-600 text-white" : "bg-red-600 text-white",
        )}
      >
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Back online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>
              No internet connection. Changes will be saved when you're back
              online.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
