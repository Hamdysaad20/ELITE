"use client";

import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import LocalizedLink from "@/components/LocalizedLink";
import { cn } from "@/lib/utils";
import {
  canAccessManagerRoutes,
  canAccessAdminRoutes,
  canAccessStorageCount,
} from "@/lib/inventory/constants";

interface AdminSidebarProps {
  role: string;
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
  requiredRole?: "manager" | "admin" | "head_barista" | "ordering";
}

interface NavGroup {
  items: NavItem[];
}

function SvgIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className="w-5 h-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      {
        href: "/admin/dashboard",
        labelKey: "dashboard",
        requiredRole: "ordering",
        icon: (
          <SvgIcon>
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </SvgIcon>
        ),
      },
    ],
  },
  {
    items: [
      {
        href: "/admin/inventory",
        labelKey: "barCount",
        icon: (
          <SvgIcon>
            <rect x="8" y="2" width="8" height="4" rx="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
          </SvgIcon>
        ),
      },
      {
        href: "/admin/inventory/storage",
        labelKey: "storageCount",
        requiredRole: "head_barista",
        icon: (
          <SvgIcon>
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
          </SvgIcon>
        ),
      },
      {
        href: "/admin/inventory/transfer",
        labelKey: "transfer",
        icon: (
          <SvgIcon>
            <path d="M8 3 4 7l4 4" />
            <path d="M4 7h16" />
            <path d="m16 21 4-4-4-4" />
            <path d="M20 17H4" />
          </SvgIcon>
        ),
      },
      {
        href: "/admin/waste",
        labelKey: "waste",
        icon: (
          <SvgIcon>
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </SvgIcon>
        ),
      },
    ],
  },
  {
    items: [
      {
        href: "/admin/purchases",
        labelKey: "purchases",
        requiredRole: "manager",
        icon: (
          <SvgIcon>
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </SvgIcon>
        ),
      },
      {
        href: "/admin/inventory/history",
        labelKey: "history",
        requiredRole: "manager",
        icon: (
          <SvgIcon>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </SvgIcon>
        ),
      },
      {
        href: "/admin/inventory/items",
        labelKey: "items",
        requiredRole: "admin",
        icon: (
          <SvgIcon>
            <path d="M20 7h-9" />
            <path d="M14 17H5" />
            <circle cx="17" cy="17" r="3" />
            <circle cx="7" cy="7" r="3" />
          </SvgIcon>
        ),
      },
    ],
  },
];

export function AdminSidebar({
  role,
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("admin.nav");
  const { data: session } = useSession();
  const userName =
    session?.user?.name || session?.user?.email?.split("@")[0] || "";
  const [signOutPending, setSignOutPending] = useState(false);

  const isActive = (href: string) => {
    const localizedPath = `/${locale}${href}`;
    if (href === "/admin/inventory") {
      return pathname === localizedPath || pathname === `/${locale}/admin`;
    }
    return pathname.startsWith(localizedPath);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-elite-black/40 backdrop-blur-sm min-[769px]:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 start-0 z-50 h-full bg-white border-e border-elite-burgundy/8",
          "flex flex-col transition-all duration-200 ease-out",
          "min-[769px]:sticky min-[769px]:top-0 min-[769px]:z-10 min-[769px]:translate-x-0 min-[769px]:h-screen",
          "w-[260px]",
          collapsed && "min-[769px]:w-[72px]",
          isOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
        )}
      >
        <div
          className={cn(
            "flex items-center h-14 border-b border-elite-burgundy/8 shrink-0",
            collapsed
              ? "min-[769px]:justify-center min-[769px]:px-0 px-4 justify-between"
              : "justify-between px-4",
          )}
        >
          <span
            className={cn(
              "font-calistoga text-elite-burgundy text-lg",
              collapsed && "min-[769px]:hidden",
            )}
          >
            {t("title")}
          </span>

          <button
            onClick={onClose}
            className="min-[769px]:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-elite-burgundy/5 text-elite-black/40"
            aria-label={t("closeSidebar")}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={onToggleCollapse}
            className="hidden min-[769px]:flex w-9 h-9 items-center justify-center rounded-xl hover:bg-elite-burgundy/5 text-elite-burgundy/50 transition-colors"
            aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
          >
            <svg
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                collapsed && "rotate-180",
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="m11 17-5-5 5-5" />
              <path d="m18 17-5-5 5-5" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_GROUPS.map((group, gi) => {
            const visibleItems = group.items.filter((item) => {
              if (!item.requiredRole) return true;
              if (item.requiredRole === "head_barista")
                return canAccessStorageCount(role);
              if (item.requiredRole === "ordering")
                return canAccessManagerRoutes(role) || role === "head_barista";
              if (item.requiredRole === "manager")
                return canAccessManagerRoutes(role);
              if (item.requiredRole === "admin")
                return canAccessAdminRoutes(role);
              return false;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={gi}>
                {gi > 0 && (
                  <div
                    className={cn(
                      "mx-4 my-1.5 border-t border-elite-burgundy/6",
                      collapsed && "min-[769px]:mx-3",
                    )}
                  />
                )}
                <div className={cn("px-2", collapsed && "min-[769px]:px-1.5")}>
                  {visibleItems.map((item) => {
                    const active = isActive(item.href);
                    const label = t(item.labelKey);
                    return (
                      <div key={item.href} className="relative group">
                        <LocalizedLink
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-xl mb-0.5 text-sm font-cabin transition-colors",
                            collapsed
                              ? "min-[769px]:justify-center min-[769px]:px-0 min-[769px]:py-2.5 px-3 py-2.5"
                              : "px-3 py-2.5",
                            active
                              ? "bg-elite-burgundy/8 text-elite-burgundy font-medium"
                              : "text-elite-black/55 hover:bg-elite-burgundy/4 hover:text-elite-black/80",
                          )}
                          onClick={onClose}
                        >
                          <span
                            className={cn(
                              "transition-colors",
                              active && "text-elite-burgundy",
                            )}
                          >
                            {item.icon}
                          </span>
                          <span
                            className={cn(
                              "transition-opacity duration-150",
                              collapsed && "min-[769px]:hidden",
                            )}
                          >
                            {label}
                          </span>
                        </LocalizedLink>

                        {collapsed && (
                          <span
                            className={cn(
                              "absolute start-full ms-2 top-1/2 -translate-y-1/2 z-50",
                              "px-2.5 py-1.5 rounded-lg bg-elite-black/90 text-white text-xs font-cabin whitespace-nowrap",
                              "opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none",
                              "hidden min-[769px]:block",
                            )}
                          >
                            {label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div
          className={cn(
            "border-t border-elite-burgundy/8 shrink-0 space-y-0.5",
            collapsed
              ? "min-[769px]:px-1.5 min-[769px]:py-3 px-3 py-3"
              : "px-3 py-3",
          )}
        >
          {/* Back to store */}
          <div className="relative group">
            <LocalizedLink
              href="/"
              className={cn(
                "flex items-center gap-2.5 rounded-xl text-sm font-cabin text-elite-black/40 hover:text-elite-burgundy hover:bg-elite-burgundy/5 transition-colors",
                collapsed
                  ? "min-[769px]:justify-center min-[769px]:px-0 min-[769px]:py-2.5 px-2.5 py-2"
                  : "px-2.5 py-2",
              )}
            >
              <svg
                className="w-4 h-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className={cn(collapsed && "min-[769px]:hidden")}>
                {t("backToStore")}
              </span>
            </LocalizedLink>
            {collapsed && (
              <span className="absolute start-full ms-2 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1.5 rounded-lg bg-elite-black/90 text-white text-xs font-cabin whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none hidden min-[769px]:block">
                {t("backToStore")}
              </span>
            )}
          </div>

          {/* User identity — avatar visible when collapsed (#11) */}
          <div className="relative group">
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-2.5 py-2",
                collapsed &&
                  "min-[769px]:justify-center min-[769px]:px-0 min-[769px]:py-2.5",
              )}
            >
              <div className="w-6 h-6 rounded-full bg-elite-burgundy/10 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-cabin font-bold text-elite-burgundy uppercase">
                  {userName.charAt(0) || "?"}
                </span>
              </div>
              <div className={cn("min-w-0", collapsed && "min-[769px]:hidden")}>
                <p className="text-xs font-cabin font-medium text-elite-black/70 truncate leading-none mb-0.5">
                  {userName}
                </p>
                <p className="text-[10px] font-cabin text-elite-black/35 leading-none">
                  {t(`roles.${role}`)}
                </p>
              </div>
            </div>
            {collapsed && (
              <span className="absolute start-full ms-2 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1.5 rounded-lg bg-elite-black/90 text-white text-xs font-cabin whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none hidden min-[769px]:block">
                {userName} · {t(`roles.${role}`)}
              </span>
            )}
          </div>

          {/* Sign-out — with confirmation (#4) */}
          <div className="relative group">
            {signOutPending ? (
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5",
                  collapsed && "min-[769px]:flex-col min-[769px]:px-0",
                )}
              >
                <span
                  className={cn(
                    "text-xs font-cabin text-red-600 shrink-0",
                    collapsed && "min-[769px]:hidden",
                  )}
                >
                  Sure?
                </span>
                <button
                  type="button"
                  onClick={() =>
                    signOut({ callbackUrl: `/${locale}/auth/signin` })
                  }
                  className="text-xs font-cabin font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg px-2.5 py-1 transition-colors shrink-0"
                >
                  {t("signOut")}
                </button>
                <button
                  type="button"
                  onClick={() => setSignOutPending(false)}
                  className="text-xs font-cabin text-elite-black/40 hover:text-elite-black/70 px-1.5 py-1 transition-colors shrink-0"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSignOutPending(true)}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-xl text-sm font-cabin text-elite-black/40 hover:text-red-600 hover:bg-red-50 transition-colors",
                  collapsed
                    ? "min-[769px]:justify-center min-[769px]:px-0 min-[769px]:py-2.5 px-2.5 py-2"
                    : "px-2.5 py-2",
                )}
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className={cn(collapsed && "min-[769px]:hidden")}>
                  {t("signOut")}
                </span>
              </button>
            )}
            {collapsed && !signOutPending && (
              <span className="absolute start-full ms-2 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1.5 rounded-lg bg-elite-black/90 text-white text-xs font-cabin whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none hidden min-[769px]:block">
                {t("signOut")}
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
