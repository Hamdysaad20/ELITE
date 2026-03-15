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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <LanguageSwitcher
          className={cn(
            "absolute -top-12 z-10",
            isRTL ? "left-4" : "right-4",
          )}
        />
        {/* Liquid Glass background with enhanced blur and transparency */}
        <div
          className="bg-gradient-to-t from-white/20 via-white/10 to-white/5 backdrop-blur-2xl border-t border-white/20"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.05) 100%)",
            backdropFilter: "blur(20px) saturate(180%)",
            boxShadow:
              "0 -8px 32px rgba(139, 38, 53, 0.08), 0 -2px 8px rgba(255, 255, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
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
                    {/* Icon container - Liquid Glass style */}
                    <div
                      className={cn(
                        "flex items-center justify-center w-11 h-11 rounded-2xl transition-all",
                        animDuration,
                        active || isOptimistic
                          ? "bg-gradient-to-br from-elite-burgundy/60 to-elite-burgundy/40 backdrop-blur-lg text-elite-cream shadow-lg shadow-elite-burgundy/20"
                          : "bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md text-elite-burgundy/70",
                      )}
                      style={{
                        transform:
                          (active || isOptimistic) && !prefersReducedMotion
                            ? "translateY(-2px) scale(1.05)"
                            : "translateY(0) scale(1)",
                        border: active || isOptimistic ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(255, 255, 255, 0.15)",
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

                    {/* Cart Badge - Liquid Glass style */}
                    {item.isCart && itemCount > 0 && (
                      <span
                        className={cn(
                          "absolute -top-0.5 text-[10px] font-bold font-cabin rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5 transition-all border",
                          isRTL ? "-left-1" : "-right-1",
                          animDuration,
                          active || isOptimistic
                            ? "bg-white/90 backdrop-blur-md text-elite-burgundy border-white/40 scale-110 shadow-lg"
                            : "bg-elite-burgundy/80 backdrop-blur-sm text-white border-white/20",
                        )}
                        style={{
                          boxShadow: active || isOptimistic 
                            ? "0 4px 12px rgba(255, 255, 255, 0.3), 0 2px 8px rgba(139, 38, 53, 0.2)" 
                            : "0 2px 8px rgba(139, 38, 53, 0.2)",
                        }}
                      >
                        {itemCount > 99 ? "99+" : itemCount}
                      </span>
                    )}
                  </div>

                  {/* Label with liquid glass theme */}
                  <span
                    className={cn(
                      "text-[11px] font-cabin leading-none transition-all",
                      animDuration,
                      active || isOptimistic
                        ? "font-bold text-elite-burgundy drop-shadow-sm"
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
