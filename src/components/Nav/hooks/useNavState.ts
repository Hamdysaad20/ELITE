"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { useLocalCart } from "@/hooks/useLocalCart";
import type { Locale } from "@/i18n/config";

export interface NavAuthState {
  isSignedIn: boolean;
  user: { name: string; initials: string; avatarUrl?: string } | null;
  cartCount: number;
}

export interface NavState {
  auth: NavAuthState;
  lang: Locale;
  isRTL: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  pathname: string;
}

function getInitials(name?: string | null): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function useNavState(): NavState {
  const { data: session, status } = useSession();
  const locale = useLocale() as Locale;
  const isRTL = locale === "ar";
  const pathname = usePathname() || "/";
  const { itemCount } = useLocalCart();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isSignedIn = status === "authenticated" && !!session?.user;

  const auth: NavAuthState = {
    isSignedIn,
    user: isSignedIn
      ? {
          name: session.user?.name || "User",
          initials: getInitials(session.user?.name),
          avatarUrl: session.user?.image || undefined,
        }
      : null,
    cartCount: itemCount,
  };

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((v) => !v), []);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return {
    auth,
    lang: locale,
    isRTL,
    drawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    pathname,
  };
}
