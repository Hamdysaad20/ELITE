"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import NetworkStatus from "@/components/NetworkStatus";
import CartButton from "@/components/Cart/CartButton";
import Navigation from "@/components/Navigation";
import MobileNavigation from "@/components/MobileNavigation";
import OrderingBanner from "@/components/OrderingBanner";
import { OrderingProvider } from "@/context/OrderingContext";
import {
  createNavigationState,
  cleanupNavigationState,
  preventLayoutShift,
  resetPageState,
} from "@/lib/utils";
import { setupOfflineSupport } from "@/lib/errorRecovery";
import { stripLocaleFromPathname } from "@/i18n/routing";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const normalizedPath = stripLocaleFromPathname(pathname || "/");

  // Hide cart and mobile nav on auth pages and order page
  const isAuthPage =
    normalizedPath.startsWith("/auth") || normalizedPath.includes("verify");
  const isOrderPage = normalizedPath === "/order";

  // Handle initialization after hydration is complete
  useEffect(() => {
    // Ensure we're in the browser
    if (typeof window === "undefined" || typeof document === "undefined")
      return;

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
    if (typeof window === "undefined" || typeof document === "undefined")
      return;

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
      <OrderingProvider>
        <NetworkStatus />
        {!isAuthPage && (
          <>
            <Navigation />
            {!isOrderPage && <CartButton />}
          </>
        )}
        <ToastProvider>
          {!isAuthPage && <OrderingBanner />}
          {children}
        </ToastProvider>
        {!isAuthPage && <MobileNavigation />}
      </OrderingProvider>
    </AuthProvider>
  );
}
