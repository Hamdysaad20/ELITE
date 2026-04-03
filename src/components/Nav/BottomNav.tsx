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

interface BottomNavProps {
  auth: NavAuthState;
}

interface TabItem {
  key: string;
  label: string;
  href: string;
  Icon: LucideIcon;
  badge?: number;
  locked?: boolean;
}

export default function BottomNav({ auth }: BottomNavProps) {
  const t = useTranslations("globalNav");
  const locale = useLocale();
  const pathname = usePathname() || "/";
  const normalizedPath = stripLocaleFromPathname(pathname);

  // Hide bottom bar on landing page — mobile uses burger menu there
  if (normalizedPath === "/" || normalizedPath === "/about") {
    return null;
  }

  const anonTabs: TabItem[] = [
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
    { key: "signin", label: t("signIn"), href: "/auth/signin", Icon: LogIn },
  ];

  const signedInTabs: TabItem[] = [
    { key: "home", label: t("home"), href: "/", Icon: Home },
    { key: "menu", label: t("menu"), href: "/menu", Icon: UtensilsCrossed },
    {
      key: "cart",
      label: t("cart"),
      href: "/checkout",
      Icon: ShoppingBag,
      badge: auth.cartCount,
    },
    { key: "orders", label: t("orders"), href: "/orders", Icon: ClipboardList },
    { key: "profile", label: t("profile"), href: "/profile", Icon: User },
  ];

  const tabs = auth.isSignedIn ? signedInTabs : anonTabs;

  const isActive = (href: string) => {
    if (href === "/") return normalizedPath === "/";
    return normalizedPath.startsWith(href);
  };

  return (
    <nav
      className="nav-bottom-bar min-[641px]:!hidden"
      aria-label={t("navigation")}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        const disabled = !!tab.locked;
        const localizedHref = addLocaleToPathname(tab.href, locale);

        // Locked/disabled tab
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

        return (
          <Link
            key={tab.key}
            href={localizedHref}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 nav-focus-ring active:scale-95 transition-all duration-150"
            role="tab"
            aria-selected={active}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {/* Icon container with active pill background */}
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
              {/* Cart badge — terracotta accent */}
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

            {/* Label */}
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
