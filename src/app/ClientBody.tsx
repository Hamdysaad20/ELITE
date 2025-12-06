"use client";

import { useEffect } from "react";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import {
  createNavigationState,
  cleanupNavigationState,
  preventLayoutShift,
  resetPageState,
} from "@/lib/utils";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  // Handle initialization after hydration is complete
  useEffect(() => {
    // Ensure we're in the browser
    if (typeof window === "undefined" || typeof document === "undefined") return;

    try {
      // Initialize navigation state
      createNavigationState();
      
      // Prevent layout shifts
      preventLayoutShift();
    } catch (error) {
      console.warn("Failed to initialize client state:", error);
    }

    // Cleanup on unmount
    return () => {
      try {
        cleanupNavigationState();
      } catch (error) {
        console.warn("Failed to cleanup navigation state:", error);
      }
    };
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        try {
          resetPageState();
        } catch (error) {
          console.warn("Failed to reset page state:", error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Handle beforeunload to clean up state
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeUnload = () => {
      try {
        cleanupNavigationState();
      } catch (error) {
        console.warn("Failed to cleanup on beforeunload:", error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
