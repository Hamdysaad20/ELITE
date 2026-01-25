"use client";

import { useAuth, useAuthActions } from "@/lib/auth/hooks";
import { useLoyalty } from "@/hooks/useLoyalty";
import { useState, useRef, useEffect } from "react";
import { Award, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { loyalty } = useLoyalty();
  const { logout } = useAuthActions();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("userMenu");
  const locale = useLocale();
  const isRTL = locale === "ar";

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (isLoading) {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <LocalizedLink
        href="/auth/signin"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 transform hover:scale-105"
      >
        {t("signIn")}
      </LocalizedLink>
    );
  }

  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.charAt(0).toUpperCase() || t("userInitial");

  const levelLabels: Record<string, string> = {
    platinum: t("levels.platinum"),
    gold: t("levels.gold"),
    silver: t("levels.silver"),
    bronze: t("levels.bronze"),
  };

  const levelKey = loyalty?.account.level?.toLowerCase() || "";
  const levelLabel = levelLabels[levelKey] || loyalty?.account.level || "";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg p-2 hover:bg-gray-100 transition-colors",
          isRTL && "flex-row-reverse",
        )}
        aria-label={t("aria.userMenu")}
        aria-expanded={isOpen}
      >
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
          {userInitials}
        </div>
        <div className={cn("hidden md:block", isRTL ? "text-right" : "text-left")}>
          <p className="text-sm font-medium text-gray-900">
            {user.name || t("user")}
          </p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute mt-2 w-64 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50",
            isRTL ? "left-0" : "right-0",
          )}
        >
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name || t("user")}
            </p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>

          {/* Loyalty Points Preview */}
          {loyalty && (
            <LocalizedLink
              href="/rewards"
              className="block px-4 py-3 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 transition-all"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      loyalty.account.level === "platinum"
                        ? "bg-gradient-to-br from-purple-500 to-purple-700"
                        : loyalty.account.level === "gold"
                          ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                          : loyalty.account.level === "silver"
                            ? "bg-gradient-to-br from-gray-400 to-gray-600"
                            : "bg-gradient-to-br from-amber-600 to-amber-800"
                    }`}
                  >
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-cabin">
                      {t("loyalty.pointsLabel")}
                    </p>
                    <p className="text-sm font-bold text-gray-900 font-cabin">
                      {t("loyalty.pointsValue", {
                        count: loyalty.account.points,
                      })}
                    </p>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${loyalty.tiers.progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-cabin capitalize">
                {levelLabel} •{" "}
                {t("loyalty.progressToNextTier", {
                  percent: Math.round(loyalty.tiers.progress),
                })}
              </p>
            </LocalizedLink>
          )}

          <div className="py-1">
            <LocalizedLink
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <div
                className={cn(
                  "flex items-center gap-3",
                  isRTL && "flex-row-reverse",
                )}
              >
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {t("links.profile")}
              </div>
            </LocalizedLink>

            <LocalizedLink
              href="/orders"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <div
                className={cn(
                  "flex items-center gap-3",
                  isRTL && "flex-row-reverse",
                )}
              >
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                {t("links.orders")}
              </div>
            </LocalizedLink>

            <LocalizedLink
              href="/rewards"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <div
                className={cn(
                  "flex items-center gap-3",
                  isRTL && "flex-row-reverse",
                )}
              >
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                  />
                </svg>
                {t("links.rewards")}
              </div>
            </LocalizedLink>

            {user.role === "admin" && (
              <LocalizedLink
                href="/admin"
                className="block px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                <div
                  className={cn(
                    "flex items-center gap-3",
                    isRTL && "flex-row-reverse",
                  )}
                >
                  <svg
                    className="h-5 w-5 text-amber-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {t("links.admin")}
                </div>
              </LocalizedLink>
            )}
          </div>

          <div className="py-1">
            <button
              onClick={async () => {
                setIsOpen(false);
                await logout();
              }}
              className={cn(
                "block w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors",
                isRTL ? "text-right" : "text-left",
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-3",
                  isRTL && "flex-row-reverse",
                )}
              >
                <svg
                  className="h-5 w-5 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                {t("signOut")}
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
