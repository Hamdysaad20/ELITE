"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useLocalCart } from "@/hooks/useLocalCart";
import { useState, useTransition, useEffect } from "react";
import CartDrawer from "@/components/Cart/CartDrawer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Bell, Home, Compass, Tag, ShoppingBag, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { addLocaleToPathname, stripLocaleFromPathname } from "@/i18n/routing";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";
import { useOrdering } from "@/context/OrderingContext";
import { openSupportMessenger } from "@/lib/support";

export default function MobileNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const localizedRouter = useLocalizedRouter();
  const normalizedPath = stripLocaleFromPathname(pathname || "/");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const t = useTranslations("mobileNav");
  const { status } = useSession();
  const { itemCount } = useLocalCart();
  const { orderingEnabled } = useOrdering();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const navItems = [
    {
      name: t("home"),
      href: "/",
      Icon: Home,
    },
    {
      name: t("explore"),
      href: "/menu",
      Icon: Compass,
    },
    {
      name: t("deals"),
      href: "/deals",
      Icon: Tag,
    },
    {
      name: t("cart"),
      href: "#cart",
      Icon: ShoppingBag,
      isCart: true,
    },
    {
      name: t("profile"),
      href: "/profile",
      Icon: User,
      requireAuth: true,
    },
  ];

  // Detect reduced motion preference for adaptive animations
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") {
      return normalizedPath === "/" || optimisticPath === "/";
    }
    if (href === "#cart") {
      return false; // Cart is never "active"
    }
    return normalizedPath.startsWith(href) || optimisticPath === href;
  };

  const handleNavigation = (
    href: string,
    requireAuth?: boolean,
    isCart?: boolean,
  ) => {
    if (isCart) {
      if (!orderingEnabled) {
        openSupportMessenger();
        return;
      }
      setIsCartOpen(true);
      return;
    }

    if (requireAuth && status === "unauthenticated") {
      const localizedCallback = addLocaleToPathname(href, locale);
      const signInPath = addLocaleToPathname("/auth/signin", locale);
      startTransition(() => {
        router.push(
          `${signInPath}?callbackUrl=${encodeURIComponent(localizedCallback)}`,
        );
      });
      return;
    }

    // Optimistic UI update
    setOptimisticPath(href);

    startTransition(() => {
      localizedRouter.push(href);
      // Reset optimistic state after navigation
      setTimeout(() => setOptimisticPath(null), 300);
    });
  };

  // Adaptive animation duration - faster for low-end devices
  const animDuration = prefersReducedMotion ? "duration-100" : "duration-300";
  const transitionStyle = prefersReducedMotion
    ? { transition: "all 0.1s ease-out" }
    : { transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" };

  return (
    <>
      {/* Premium cream-colored bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 relative">
        <LanguageSwitcher
          className={cn(
            "absolute -top-12 z-10",
            isRTL ? "left-4" : "right-4",
          )}
        />
        {/* Background with cream gradient and subtle shadow */}
        <div
          className="bg-gradient-to-t from-elite-cream via-elite-cream to-elite-cream/95 backdrop-blur-xl border-t border-elite-burgundy/8"
          style={{
            boxShadow:
              "0 -8px 40px rgba(139, 38, 53, 0.12), 0 -2px 8px rgba(139, 38, 53, 0.08)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <div className="flex items-stretch justify-around h-[72px] max-w-lg mx-auto">
            {navItems.map((item) => {
              const Icon =
                item.isCart && !orderingEnabled ? Bell : item.Icon;
              const active = isActive(item.href);
              const isOptimistic = optimisticPath === item.href;
              const label =
                item.isCart && !orderingEnabled ? "Updates" : item.name;

              return (
                <button
                  key={item.name}
                  onClick={() =>
                    handleNavigation(item.href, item.requireAuth, item.isCart)
                  }
                  disabled={isPending && isOptimistic}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 flex-1 touch-manipulation",
                    "active:scale-95 transition-transform",
                    animDuration,
                  )}
                  style={transitionStyle}
                >
                  <div className="relative">
                    {/* Icon container - optimized for active state */}
                    <div
                      className={cn(
                        "flex items-center justify-center w-11 h-11 rounded-2xl transition-all",
                        animDuration,
                        active || isOptimistic
                          ? "bg-elite-burgundy text-elite-cream shadow-lg shadow-elite-burgundy/30"
                          : "bg-elite-dark-cream/40 text-elite-burgundy/65",
                      )}
                      style={{
                        transform:
                          (active || isOptimistic) && !prefersReducedMotion
                            ? "translateY(-2px) scale(1.05)"
                            : "translateY(0) scale(1)",
                      }}
                    >
                      <Icon
                        className={cn(
                          "transition-all",
                          animDuration,
                          active || isOptimistic ? "w-6 h-6" : "w-5 h-5",
                        )}
                        strokeWidth={active || isOptimistic ? 2.5 : 2}
                      />

                      {/* Optimistic loading pulse */}
                      {isOptimistic && isPending && (
                        <div className="absolute inset-0 rounded-2xl bg-elite-cream/20 animate-pulse" />
                      )}
                    </div>

                    {/* Cart Badge - Premium style */}
                    {item.isCart && itemCount > 0 && (
                      <span
                        className={cn(
                          "absolute -top-0.5 text-[10px] font-bold font-cabin rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5 transition-all border-2",
                          isRTL ? "-left-1" : "-right-1",
                          animDuration,
                          active || isOptimistic
                            ? "bg-elite-cream text-elite-burgundy border-elite-burgundy scale-110 shadow-sm"
                            : "bg-elite-burgundy text-elite-cream border-elite-cream",
                        )}
                        style={{
                          boxShadow: "0 2px 8px rgba(139, 38, 53, 0.25)",
                        }}
                      >
                        {itemCount > 99 ? "99+" : itemCount}
                      </span>
                    )}
                  </div>

                  {/* Label with optimistic highlight */}
                  <span
                    className={cn(
                      "text-[11px] font-cabin leading-none transition-all",
                      animDuration,
                      active || isOptimistic
                        ? "font-bold text-elite-burgundy"
                        : "font-medium text-elite-burgundy/50",
                    )}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
