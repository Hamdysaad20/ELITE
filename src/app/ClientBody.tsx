"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import NetworkStatus from "@/components/NetworkStatus";
import CartButton from "@/components/Cart/CartButton";
import Nav from "@/components/Nav";
import { OrderingProvider } from "@/context/OrderingContext";
import { CartDrawerProvider } from "@/context/CartDrawerContext";
import { OrderingBanner } from "@/components/OrderingBanner";
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
  // Landing page has no bottom bar — skip body offset padding
  const isLandingPage = normalizedPath === "/" || normalizedPath === "/about";
  // Sub-pages render their own back-button header — no global nav body offset needed
  const isOverlayPage =
    /^\/menu\/.+/.test(normalizedPath) ||
    /^\/products\/.+/.test(normalizedPath) ||
    /^\/orders\/.+/.test(normalizedPath);

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

  // Handle pagehide to clean up state (supports bfcache)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePageHide = () => {
      try {
        cleanupNavigationState();
      } catch (error) {
        console.warn("Failed to cleanup on pagehide:", error);
      }
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  return (
    <AuthProvider>
      <OrderingProvider lazy={isLandingPage || isAuthPage}>
        <CartDrawerProvider>
          <NetworkStatus />
          {!isAuthPage && (
            <>
              <Nav />
              {!isOrderPage && <CartButton />}
            </>
          )}
          <ToastProvider>
            <main
              className={
                isLandingPage || isAuthPage || isOverlayPage
                  ? ""
                  : "nav-body-offset"
              }
            >
              {!isLandingPage && !isAuthPage && !isOverlayPage && (
                <OrderingBanner />
              )}
              {children}
            </main>
          </ToastProvider>
        </CartDrawerProvider>
      </OrderingProvider>
    </AuthProvider>
  );
}
