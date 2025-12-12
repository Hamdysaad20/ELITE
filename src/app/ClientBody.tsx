"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import NetworkStatus from "@/components/NetworkStatus";
import CartButton from "@/components/Cart/CartButton";
import Navigation from "@/components/Navigation";
import MobileNavigation from "@/components/MobileNavigation";
import {
  createNavigationState,
  cleanupNavigationState,
  preventLayoutShift,
  resetPageState,
} from "@/lib/utils";
import { setupOfflineSupport } from "@/lib/errorRecovery";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Hide cart and mobile nav on auth pages and order page
  const isAuthPage = pathname?.startsWith("/auth") || pathname?.includes("verify");
  const isOrderPage = pathname === "/order";
  
  // Handle initialization after hydration is complete
  useEffect(() => {
    // Ensure we're in the browser
    if (typeof window === "undefined" || typeof document === "undefined") return;

    try {
      // Initialize navigation state
      createNavigationState();
      
      // Prevent layout shifts
      preventLayoutShift();
      
      // Setup offline request queue support
      setupOfflineSupport();
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
      <NetworkStatus />
      {!isAuthPage && (
        <>
          <Navigation />
          {!isOrderPage && <CartButton />}
        </>
      )}
      <ToastProvider>
        {children}
      </ToastProvider>
      {!isAuthPage && <MobileNavigation />}
    </AuthProvider>
  );
}
