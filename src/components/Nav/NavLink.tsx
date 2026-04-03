"use client";

import { usePathname } from "next/navigation";
import LocalizedLink from "@/components/LocalizedLink";
import { stripLocaleFromPathname } from "@/i18n/routing";

export interface NavLinkItem {
  key: string;
  label: string;
  href: string;
  accent: boolean;
  comingSoon: boolean;
}

interface NavLinkProps {
  item: NavLinkItem;
  className?: string;
  soonLabel?: string;
}

export default function NavLink({
  item,
  className,
  soonLabel = "soon",
}: NavLinkProps) {
  const pathname = usePathname() || "/";
  const normalizedPath = stripLocaleFromPathname(pathname);
  const isActive = item.href !== "/" && normalizedPath.startsWith(item.href);

  if (item.comingSoon) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 font-cabin text-[13px] font-medium cursor-default select-none ${className || ""}`}
        style={{
          color: "var(--nav-link-default)",
          opacity: 0.5,
          borderRadius: "var(--nav-radius)",
        }}
      >
        {item.label}
        <span
          className="text-[9px] px-1.5 py-[2px] font-semibold leading-none"
          style={{
            color: "var(--nav-ar-color)",
            border: "1px solid var(--nav-ar-border)",
            backgroundColor: "var(--nav-ar-bg)",
            borderRadius: "var(--nav-radius)",
          }}
        >
          {soonLabel}
        </span>
      </span>
    );
  }

  const colorClass = item.accent
    ? "nav-link-accent"
    : isActive
      ? "nav-link-active-pill"
      : "nav-link-default";

  return (
    <LocalizedLink
      href={item.href}
      className={`inline-flex items-center px-3.5 py-1.5 font-cabin text-[13px] font-medium tracking-wide nav-focus-ring nav-link-pill ${colorClass} ${className || ""}`}
      style={{ borderRadius: "var(--nav-radius)" }}
    >
      {item.label}
    </LocalizedLink>
  );
}
