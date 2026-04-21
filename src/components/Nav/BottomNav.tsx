"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  UtensilsCrossed,
  Tag,
  Gift,
  LogIn,
  ShoppingBag,
  ClipboardList,
  User,
} from "lucide-react";
import { addLocaleToPathname, stripLocaleFromPathname } from "@/i18n/routing";
import type { NavAuthState } from "./hooks/useNavState";
import { useOrdering } from "@/context/OrderingContext";
import { useCartDrawer } from "@/context/CartDrawerContext";
import { useLocalCart } from "@/hooks/useLocalCart";

interface BottomNavProps {
  auth: NavAuthState;
  drawerOpen?: boolean;
}

interface TabItem {
  key: string;
  label: string;
  href?: string;
  Icon: LucideIcon;
  badge?: number;
  locked?: boolean;
  /** Opens the cart/plan drawer instead of navigating */
  openDrawer?: boolean;
}

export default function BottomNav({
  auth,
  drawerOpen = false,
}: BottomNavProps) {
  const t = useTranslations("globalNav");
  const locale = useLocale();
  const pathname = usePathname() || "/";
  const normalizedPath = stripLocaleFromPathname(pathname);
  const { orderingEnabled } = useOrdering();
  const { open: openPlanDrawer } = useCartDrawer();
  const { itemCount } = useLocalCart();

  // Hide bottom bar on landing page
  if (normalizedPath === "/" || normalizedPath === "/about") return null;

  // Overlay sub-pages provide their own navigation chrome
  const isOverlayPage =
    /^\/menu\/.+/.test(normalizedPath) ||
    /^\/products\/.+/.test(normalizedPath) ||
    /^\/orders\/.+/.test(normalizedPath);
  if (isOverlayPage) return null;

  // Hide while drawer is open so it doesn't obscure the drawer footer
  if (drawerOpen) return null;

  const planTab: TabItem = {
    key: "plan",
    label: t("plan"),
    Icon: ClipboardList,
    badge: itemCount,
    openDrawer: true,
  };

  const anonTabs: TabItem[] = orderingEnabled
    ? [
        { key: "home", label: t("home"), href: "/", Icon: Home },
        { key: "menu", label: t("menu"), href: "/menu", Icon: UtensilsCrossed },
        {
          key: "deals",
          label: t("deals"),
          href: "/deals",
          Icon: Tag,
          locked: true,
        },
        {
          key: "rewards",
          label: t("rewards"),
          href: "/rewards",
          Icon: Gift,
          locked: true,
        },
        {
          key: "signin",
          label: t("signIn"),
          href: "/auth/signin",
          Icon: LogIn,
        },
      ]
    : [
        { key: "home", label: t("home"), href: "/", Icon: Home },
        { key: "menu", label: t("menu"), href: "/menu", Icon: UtensilsCrossed },
        planTab,
        {
          key: "deals",
          label: t("deals"),
          href: "/deals",
          Icon: Tag,
          locked: true,
        },
        {
          key: "signin",
          label: t("signIn"),
          href: "/auth/signin",
          Icon: LogIn,
        },
      ];

  const signedInTabs: TabItem[] = orderingEnabled
    ? [
        { key: "home", label: t("home"), href: "/home", Icon: Home },
        { key: "menu", label: t("menu"), href: "/menu", Icon: UtensilsCrossed },
        {
          key: "cart",
          label: t("cart"),
          href: "/checkout",
          Icon: ShoppingBag,
          badge: auth.cartCount,
        },
        {
          key: "orders",
          label: t("orders"),
          href: "/orders",
          Icon: ClipboardList,
        },
        { key: "profile", label: t("profile"), href: "/profile", Icon: User },
      ]
    : [
        { key: "home", label: t("home"), href: "/home", Icon: Home },
        { key: "menu", label: t("menu"), href: "/menu", Icon: UtensilsCrossed },
        planTab,
        {
          key: "orders",
          label: t("orders"),
          href: "/orders",
          Icon: ClipboardList,
        },
        { key: "profile", label: t("profile"), href: "/profile", Icon: User },
      ];

  const tabs = auth.isSignedIn ? signedInTabs : anonTabs;

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/" || href === "/home")
      return normalizedPath === "/" || normalizedPath === "/home";
    return normalizedPath.startsWith(href);
  };

  return (
    <nav
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="nav-bottom-bar min-[641px]:!hidden"
      aria-label={t("navigation")}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        const disabled = !!tab.locked;

        // ── Locked / coming-soon tab ────────────────────────────────────
        if (disabled) {
          return (
            <span
              key={tab.key}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1"
              role="tab"
              aria-selected={false}
              aria-disabled="true"
            >
              <tab.Icon
                className="w-[20px] h-[20px]"
                strokeWidth={1.6}
                style={{ color: "var(--nav-border)", opacity: 0.7 }}
              />
              <span
                className="font-cabin text-[10px] leading-none"
                style={{ color: "var(--nav-border)", opacity: 0.7 }}
              >
                {tab.label}
              </span>
            </span>
          );
        }

        // ── Plan / drawer-opening tab ───────────────────────────────────
        if (tab.openDrawer) {
          const hasBadge = (tab.badge ?? 0) > 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={openPlanDrawer}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 nav-focus-ring active:scale-95 transition-all duration-150"
              role="tab"
              aria-selected={false}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <div
                className="relative flex items-center justify-center transition-all duration-200"
                style={{
                  width: "44px",
                  height: "28px",
                  borderRadius: "var(--nav-radius)",
                  backgroundColor: hasBadge
                    ? "var(--nav-pill-active)"
                    : "transparent",
                }}
              >
                <tab.Icon
                  className="w-[20px] h-[20px] transition-colors duration-200"
                  strokeWidth={hasBadge ? 2 : 1.6}
                  style={{
                    color: hasBadge
                      ? "var(--nav-link-active)"
                      : "var(--nav-link-default)",
                  }}
                />
                {hasBadge && (
                  <span
                    className="absolute flex items-center justify-center font-cabin font-semibold"
                    style={{
                      width: "16px",
                      height: "16px",
                      fontSize: "9px",
                      background: "linear-gradient(135deg, #C4683C, #D4784C)",
                      color: "#FDFBF7",
                      border: "1.5px solid var(--nav-bg)",
                      top: "-2px",
                      insetInlineEnd: "0px",
                      boxShadow: "0 1px 3px rgba(196, 104, 60, 0.3)",
                      borderRadius: "var(--nav-radius)",
                    }}
                  >
                    {(tab.badge ?? 0) > 9 ? "9+" : tab.badge}
                  </span>
                )}
              </div>
              <span
                className="font-cabin text-[10px] leading-none transition-colors duration-200"
                style={{
                  color: hasBadge
                    ? "var(--nav-link-active)"
                    : "var(--nav-link-default)",
                  fontWeight: hasBadge ? 600 : 400,
                  letterSpacing: hasBadge ? "0.01em" : "0",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        }

        // ── Standard link tab ───────────────────────────────────────────
        const localizedHref = addLocaleToPathname(tab.href!, locale);
        return (
          <Link
            key={tab.key}
            href={localizedHref}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 nav-focus-ring active:scale-95 transition-all duration-150"
            role="tab"
            aria-selected={active}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <div
              className="relative flex items-center justify-center transition-all duration-200"
              style={{
                width: "44px",
                height: "28px",
                borderRadius: "var(--nav-radius)",
                backgroundColor: active
                  ? "var(--nav-pill-active)"
                  : "transparent",
              }}
            >
              <tab.Icon
                className="w-[20px] h-[20px] transition-colors duration-200"
                strokeWidth={active ? 2 : 1.6}
                style={{
                  color: active
                    ? "var(--nav-link-active)"
                    : "var(--nav-link-default)",
                }}
              />
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className="absolute flex items-center justify-center font-cabin font-semibold"
                  style={{
                    width: "16px",
                    height: "16px",
                    fontSize: "9px",
                    background: "linear-gradient(135deg, #C4683C, #D4784C)",
                    color: "#FDFBF7",
                    border: "1.5px solid var(--nav-bg)",
                    top: "-2px",
                    insetInlineEnd: "0px",
                    boxShadow: "0 1px 3px rgba(196, 104, 60, 0.3)",
                    borderRadius: "var(--nav-radius)",
                  }}
                >
                  {tab.badge > 9 ? "9+" : tab.badge}
                </span>
              )}
            </div>
            <span
              className="font-cabin text-[10px] leading-none transition-colors duration-200"
              style={{
                color: active
                  ? "var(--nav-link-active)"
                  : "var(--nav-link-default)",
                fontWeight: active ? 600 : 400,
                letterSpacing: active ? "0.01em" : "0",
              }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
