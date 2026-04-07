"use client";

import { type Ref } from "react";
import { ShoppingBag, Menu } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import LocalizedLink from "@/components/LocalizedLink";
import LangToggle from "./LangToggle";
import type { NavAuthState } from "./hooks/useNavState";
import { stripLocaleFromPathname } from "@/i18n/routing";

interface MobileTopBarProps {
  auth: NavAuthState;
  drawerOpen: boolean;
  onOpenDrawer: () => void;
  hamburgerRef: Ref<HTMLButtonElement>;
}

export default function MobileTopBar({
  auth,
  drawerOpen,
  onOpenDrawer,
  hamburgerRef,
}: MobileTopBarProps) {
  const t = useTranslations("globalNav");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const pathname = usePathname() ?? "";
  const normalizedPath = stripLocaleFromPathname(pathname);

  // On sub-pages, the page renders its own back-button header — hide the global top bar
  const isOverlayPage =
    /^\/menu\/.+/.test(normalizedPath) ||
    /^\/products\/.+/.test(normalizedPath) ||
    /^\/orders\/.+/.test(normalizedPath);

  if (isOverlayPage) return null;

  return (
    <header
      dir={isRtl ? "rtl" : "ltr"}
      className="fixed top-0 inset-x-0 z-[100] block min-[641px]:!hidden"
      style={{
        backgroundColor: "var(--nav-bg-glass)",
        backdropFilter: "blur(28px) saturate(170%)",
        WebkitBackdropFilter: "blur(28px) saturate(170%)",
        borderBottom: "1px solid var(--nav-border)",
        height: "var(--nav-height-mobile)",
        boxShadow: "var(--nav-shadow-subtle)",
      }}
    >
      <div className="flex items-center h-full px-4 gap-3">
        {/* Logo — properly sized for mobile */}
        <LocalizedLink
          href="/"
          className="flex-shrink-0 nav-focus-ring rounded-xl group"
        >
          <img
            src="/images/logo_noBG.png"
            alt={t("logoAlt")}
            className="w-auto object-contain transition-all duration-300 group-hover:opacity-80"
            style={{
              height: "40px",
              maxWidth: "155px",
            }}
          />
        </LocalizedLink>

        <div className="flex-1" />

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <LangToggle />

          {/* Cart badge — signed-in + items only */}
          {auth.isSignedIn && auth.cartCount > 0 && (
            <LocalizedLink
              href="/checkout"
              className="relative flex items-center justify-center rounded-full nav-focus-ring transition-all duration-200 active:scale-90"
              style={{
                width: "36px",
                height: "36px",
                backgroundColor: "var(--nav-ar-bg)",
                border: "1.5px solid var(--nav-ar-border)",
                borderRadius: "var(--nav-radius)",
              }}
            >
              <ShoppingBag
                className="w-[17px] h-[17px]"
                style={{ color: "var(--nav-ar-color)" }}
                strokeWidth={1.8}
              />
              <span
                className="absolute flex items-center justify-center rounded-full font-cabin font-bold leading-none"
                style={{
                  width: "16px",
                  height: "16px",
                  fontSize: "9px",
                  background: "linear-gradient(135deg, #8B2635, #A03040)",
                  color: "#FBF4E0",
                  border: "1.5px solid var(--nav-bg)",
                  top: "-2px",
                  insetInlineEnd: "-2px",
                  boxShadow: "0 1px 4px rgba(139,38,53,0.35)",
                  borderRadius: "var(--nav-radius)",
                }}
              >
                {auth.cartCount > 9 ? "9+" : auth.cartCount}
              </span>
            </LocalizedLink>
          )}

          {/* Hamburger */}
          <button
            ref={hamburgerRef}
            onClick={onOpenDrawer}
            className="flex items-center justify-center rounded-full nav-focus-ring transition-all duration-200 active:scale-90"
            style={{
              width: "36px",
              height: "36px",
              backgroundColor: "var(--nav-ar-bg)",
              border: "1.5px solid var(--nav-ar-border)",
              borderRadius: "var(--nav-radius)",
              WebkitTapHighlightColor: "transparent",
            }}
            aria-label={t("openMenu")}
            aria-expanded={drawerOpen}
            type="button"
          >
            <Menu
              className="w-[17px] h-[17px]"
              style={{ color: "var(--nav-ar-color)" }}
              strokeWidth={2}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
