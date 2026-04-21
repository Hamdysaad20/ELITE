"use client";

import { useEffect, useRef, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import {
  X,
  UtensilsCrossed,
  MapPin,
  Tag,
  ShoppingBag,
  Coffee,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";
import LangToggle from "./LangToggle";
import { stripLocaleFromPathname } from "@/i18n/routing";
import type { NavAuthState } from "./hooks/useNavState";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  auth: NavAuthState;
  hamburgerRef: React.RefObject<HTMLButtonElement | null>;
}

interface DrawerNavItem {
  key: string;
  label: string;
  href: string;
  Icon: LucideIcon;
  accent?: boolean;
  comingSoon?: boolean;
}

export default function Drawer({
  open,
  onClose,
  auth,
  hamburgerRef,
}: DrawerProps) {
  const t = useTranslations("globalNav");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname() || "/";
  const normalizedPath = stripLocaleFromPathname(pathname);

  const items: DrawerNavItem[] = [
    { key: "menu", label: t("menu"), href: "/menu", Icon: UtensilsCrossed },
    { key: "location", label: t("location"), href: "/#location", Icon: MapPin },
    {
      key: "deals",
      label: t("deals"),
      href: "/deals",
      Icon: Tag,
      comingSoon: true,
    },
    {
      key: "shop",
      label: t("shop"),
      href: "/shop",
      Icon: ShoppingBag,
      comingSoon: true,
    },
    { key: "about", label: t("aboutElite"), href: "/", Icon: Coffee },
  ];

  const isActive = (href: string) =>
    href !== "/" && normalizedPath.startsWith(href);

  // Focus close button on open
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        hamburgerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose, hamburgerRef]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !drawerRef.current) return;
    const els = drawerRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (els.length === 0) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  return (
    <>
      {open && (
        <div
          className="nav-drawer-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        ref={drawerRef}
        dir={isRtl ? "rtl" : "ltr"}
        className="nav-drawer flex flex-col"
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-label={t("navigation")}
        onKeyDown={handleKeyDown}
        style={{ backgroundColor: "var(--nav-bg)" }}
      >
        {/* ── Drawer header ──────────────────────────── */}
        <div
          className="flex-shrink-0"
          style={{ borderBottom: "1px solid var(--nav-border)" }}
        >
          {/* Safe-area spacer — pushes content below notch / Dynamic Island */}
          <div style={{ height: "env(safe-area-inset-top, 0px)" }} />
          <div
            className="flex items-center justify-between px-5"
            style={{ height: "var(--nav-height-mobile)" }}
          >
            <img
              src="/images/logo_noBG.png"
              alt={t("logoAlt")}
              className="w-auto object-contain flex-shrink-0"
              style={{
                height: "40px",
                maxWidth: "155px",
              }}
            />
            <button
              ref={closeRef}
              onClick={() => {
                onClose();
                hamburgerRef.current?.focus();
              }}
              className="flex items-center justify-center rounded-full nav-focus-ring transition-all duration-200 active:scale-90"
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "var(--nav-ar-bg)",
                border: "1.5px solid var(--nav-ar-border)",
                borderRadius: "var(--nav-radius)",
              }}
              aria-label={t("closeMenu")}
              type="button"
            >
              <X
                className="w-[15px] h-[15px]"
                style={{ color: "var(--nav-ar-color)" }}
                strokeWidth={2.2}
              />
            </button>
          </div>
        </div>

        {/* ── Nav links ─────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
          <div className="space-y-1">
            {items.map((item) => {
              const active = isActive(item.href);

              if (item.comingSoon) {
                return (
                  <span
                    key={item.key}
                    className="flex items-center gap-3 px-4 py-3 font-cabin text-[14px] font-medium cursor-default select-none"
                    style={{
                      color: "var(--nav-link-default)",
                      opacity: 0.5,
                      borderRadius: "var(--nav-radius-lg)",
                    }}
                    aria-disabled="true"
                  >
                    <item.Icon
                      className="w-[18px] h-[18px] flex-shrink-0"
                      strokeWidth={1.6}
                    />
                    <span className="flex-1">{item.label}</span>
                    <span
                      className="text-[9px] px-2 py-[3px] font-semibold leading-none"
                      style={{
                        color: "var(--nav-ar-color)",
                        border: "1px solid var(--nav-ar-border)",
                        backgroundColor: "var(--nav-ar-bg)",
                        borderRadius: "var(--nav-radius)",
                      }}
                    >
                      {t("soon")}
                    </span>
                  </span>
                );
              }

              const linkClass = item.accent
                ? "nav-drawer-link-accent"
                : active
                  ? "nav-drawer-link-active"
                  : "nav-drawer-link";

              return (
                <LocalizedLink
                  key={item.key}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 font-cabin text-[14px] font-medium nav-focus-ring transition-all duration-200 ${linkClass}`}
                  style={{ borderRadius: "var(--nav-radius-lg)" }}
                >
                  <item.Icon
                    className="w-[18px] h-[18px] flex-shrink-0"
                    strokeWidth={active ? 2 : 1.6}
                  />
                  <span className="flex-1">{item.label}</span>
                  {active && (
                    <span
                      className="w-1.5 h-1.5 flex-shrink-0"
                      style={{
                        backgroundColor: "var(--nav-link-active)",
                        borderRadius: "var(--nav-radius)",
                      }}
                    />
                  )}
                </LocalizedLink>
              );
            })}
          </div>
        </nav>

        {/* ── Drawer footer ─────────────────────────── */}
        <div
          className="flex-shrink-0 px-5 pt-4 space-y-3"
          style={{
            borderTop: "1px solid var(--nav-border)",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)",
          }}
        >
          <LangToggle variant="full" />

          {auth.isSignedIn ? (
            <div
              className="flex items-center justify-between px-4 py-3 font-cabin text-[13px]"
              style={{
                backgroundColor: "var(--nav-ar-bg)",
                border: "1px solid var(--nav-ar-border)",
                color: "var(--nav-ar-color)",
                borderRadius: "var(--nav-radius-lg)",
              }}
            >
              <span className="font-semibold">{t("rewards")}</span>
              <span
                className="text-[9px] px-2 py-1 font-semibold leading-none"
                style={{
                  border: "1px solid var(--nav-ar-border)",
                  color: "var(--nav-ar-color)",
                  backgroundColor: "var(--nav-bg)",
                  borderRadius: "var(--nav-radius)",
                }}
              >
                {t("soon")}
              </span>
            </div>
          ) : (
            <LocalizedLink
              href="/menu"
              className="flex items-center justify-center w-full py-3 font-cabin text-[14px] font-semibold tracking-wide nav-focus-ring nav-drawer-signin-cta"
              style={{ borderRadius: "var(--nav-radius-lg)" }}
            >
              {t("exploreMenu")}
            </LocalizedLink>
          )}
        </div>
      </div>
    </>
  );
}
