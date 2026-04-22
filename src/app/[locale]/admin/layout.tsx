"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { canAccessInventory } from "@/lib/inventory/constants";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const COLLAPSED_KEY = "admin-sidebar-collapsed";

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("admin");
  const tNav = useTranslations("admin.nav");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const role = session?.user?.role as string | undefined;

  const pageTitle = (() => {
    if (pathname.endsWith("/admin/inventory/storage"))
      return tNav("storageCount");
    if (pathname.endsWith("/admin/inventory/transfer")) return tNav("transfer");
    if (pathname.endsWith("/admin/inventory/history")) return tNav("history");
    if (pathname.endsWith("/admin/inventory/items")) return tNav("items");
    if (pathname.includes("/admin/inventory")) return tNav("barCount");
    if (pathname.endsWith("/admin/waste")) return tNav("waste");
    if (pathname.endsWith("/admin/purchases")) return tNav("purchases");
    if (pathname.endsWith("/admin/dashboard")) return tNav("dashboard");
    return tNav("pageHome");
  })();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_KEY);
      if (stored === "true") setSidebarCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace(`/${locale}/auth/signin`);
      return;
    }
    if (!canAccessInventory(role)) {
      router.replace(`/${locale}`);
    }
  }, [session, status, role, router, locale]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-elite-cream">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-elite-burgundy/30 border-t-elite-burgundy rounded-full animate-spin" />
          <p className="text-sm text-elite-black/50 font-cabin">
            {t("loading")}
          </p>
        </div>
      </div>
    );
  }

  if (!session || !canAccessInventory(role)) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-elite-cream">
      <AdminSidebar
        role={role ?? "barista"}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center h-14 px-4 bg-elite-cream/95 backdrop-blur-sm border-b border-elite-burgundy/10 min-[769px]:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-elite-burgundy/5"
            aria-label={t("nav.openSidebar")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="text-elite-burgundy"
            >
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
          <span className="ms-3 font-calistoga text-elite-burgundy text-base">
            {pageTitle}
          </span>
        </header>

        <main className="flex-1 p-4 min-[769px]:p-6">{children}</main>
      </div>
    </div>
  );
}
