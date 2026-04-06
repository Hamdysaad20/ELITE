"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";
import NavLink, { type NavLinkItem } from "./NavLink";
import LangToggle from "./LangToggle";
import type { NavAuthState } from "./hooks/useNavState";

interface DesktopHeaderProps {
  auth: NavAuthState;
}

export default function DesktopHeader({ auth }: DesktopHeaderProps) {
  const t = useTranslations("globalNav");

  const navItems: NavLinkItem[] = [
    {
      key: "menu",
      label: t("menu"),
      href: "/menu",
      accent: false,
      comingSoon: false,
    },
    {
      key: "location",
      label: t("location"),
      href: "/#location",
      accent: false,
      comingSoon: false,
    },
    {
      key: "deals",
      label: t("deals"),
      href: "/deals",
      accent: false,
      comingSoon: true,
    },
    {
      key: "shop",
      label: t("shop"),
      href: "/shop",
      accent: false,
      comingSoon: true,
    },
  ];

  return (
    <header
      className="sticky top-0 z-[100] hidden min-[641px]:block"
      style={{
        backgroundColor: "var(--nav-bg-glass)",
        backdropFilter: "blur(28px) saturate(170%)",
        WebkitBackdropFilter: "blur(28px) saturate(170%)",
        borderBottom: "1px solid var(--nav-border)",
        boxShadow: "var(--nav-shadow-subtle)",
      }}
    >
      <div
        className="mx-auto relative flex items-center px-5 min-[768px]:px-6 min-[1024px]:px-8 min-[1280px]:px-10"
        style={{ maxWidth: "1280px", height: "var(--nav-height-desktop)" }}
      >
        {/* ── Logo ─────────────────────────────────────── */}
        <LocalizedLink
          href="/"
          className="flex-shrink-0 nav-focus-ring rounded-2xl group z-10"
          style={{ minWidth: 0 }}
        >
          <img
            src="/images/logo_noBG.png"
            alt={t("logoAlt")}
            className="w-auto object-contain transition-all duration-300 group-hover:opacity-80 group-hover:scale-[0.97]"
            style={{
              height: "50px",
              maxWidth: "190px",
            }}
          />
        </LocalizedLink>

        {/* ── Nav links — absolutely centered ──────────── */}
        <nav
          aria-label={t("navigation")}
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 min-[768px]:gap-1.5"
          style={{
            backgroundColor: "rgba(248, 240, 210, 0.5)",
            borderRadius: "var(--nav-radius)",
            padding: "4px 6px",
            border: "1px solid rgba(221, 208, 184, 0.35)",
          }}
        >
          {navItems.map((item) => {
            if (item.comingSoon) {
              return (
                <span
                  key={item.key}
                  className="hidden min-[1024px]:inline-flex"
                >
                  <NavLink item={item} soonLabel={t("soon")} />
                </span>
              );
            }
            return <NavLink key={item.key} item={item} soonLabel={t("soon")} />;
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Right group ──────────────────────────────── */}
        <div className="flex items-center gap-2.5 z-10">
          <LangToggle />

          {auth.isSignedIn && auth.user ? (
            /* Avatar */
            <LocalizedLink
              href="/profile"
              className="flex-shrink-0 nav-focus-ring rounded-full group"
            >
              <div
                className="flex items-center justify-center overflow-hidden rounded-full transition-all duration-200 group-hover:scale-105 group-hover:shadow-md"
                style={{
                  width: "38px",
                  height: "38px",
                  backgroundColor: "var(--nav-ar-bg)",
                  border: "2px solid var(--nav-ar-border)",
                  boxShadow: "0 1px 6px rgba(139, 38, 53, 0.1)",
                }}
              >
                {auth.user.avatarUrl ? (
                  <Image
                    src={auth.user.avatarUrl}
                    alt={auth.user.name}
                    width={38}
                    height={38}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    className="font-cabin text-xs font-semibold"
                    style={{ color: "var(--nav-ar-color)" }}
                  >
                    {auth.user.initials}
                  </span>
                )}
              </div>
            </LocalizedLink>
          ) : (
            <div className="flex items-center gap-2">
              {/* Sign In — text link, hidden on tight tablet */}
              <LocalizedLink
                href="/auth/signin"
                className="hidden min-[768px]:inline-flex items-center px-4 py-1.5 rounded-full font-cabin text-[13px] font-medium tracking-wide transition-all duration-200 nav-focus-ring nav-link-pill nav-link-default"
              >
                {t("signIn")}
              </LocalizedLink>

              {/* Explore Menu — burgundy filled pill CTA */}
              <LocalizedLink
                href="/menu"
                className="inline-flex items-center px-5 py-2 rounded-full font-cabin text-[13px] font-semibold tracking-wide nav-focus-ring nav-join-btn"
              >
                {t("exploreMenu")}
              </LocalizedLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
