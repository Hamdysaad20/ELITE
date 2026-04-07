"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type InAppNotification = {
  id: string;
  productId: string;
  productName: string;
  createdAt: string;
  title: string;
  message: string;
};

type ApiResponse = {
  success: boolean;
  unreadCount: number;
  notifications: InAppNotification[];
};

function formatRelative(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffSec = Math.max(1, Math.floor((now - then) / 1000));

  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

export default function InAppNotificationsBell() {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const t = useTranslations("notifications");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const isFetchingRef = useRef(false);
  const lastStreamSignatureRef = useRef("");

  const fetchNotifications = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    try {
      const response = await fetch("/api/notify/in-app", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as ApiResponse;
      setUnreadCount(data.unreadCount || 0);
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Failed to load in-app notifications:", error);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      source = new EventSource("/api/notify/in-app/stream");

      source.addEventListener("update", (event) => {
        try {
          const data = JSON.parse((event as MessageEvent).data) as {
            unreadCount: number;
            latest: Array<{ id: string; productId: string; createdAt: string }>;
          };

          const signature = `${data.unreadCount}:${(data.latest || [])
            .map((item) => item.id)
            .join(",")}`;

          if (signature === lastStreamSignatureRef.current) {
            return;
          }
          lastStreamSignatureRef.current = signature;

          setUnreadCount(data.unreadCount || 0);

          // Refresh detailed content only when popover is open.
          if (open) {
            fetchNotifications();
          }
        } catch (error) {
          console.error("Failed to parse notification stream payload:", error);
        }
      });

      source.addEventListener("end", () => {
        source?.close();
        reconnectTimer = setTimeout(connect, 1500);
      });

      source.onerror = () => {
        source?.close();
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (source) {
        source.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [fetchNotifications, open]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const badgeLabel = useMemo(() => {
    if (unreadCount > 99) return "99+";
    return String(unreadCount);
  }, [unreadCount]);

  const markAllRead = async () => {
    try {
      const response = await fetch("/api/notify/in-app", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clearAll: true }),
      });

      if (!response.ok) return;

      setUnreadCount(0);
      setNotifications([]);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-12 h-12 rounded-full bg-elite-burgundy/10 hover:bg-elite-burgundy/20 border-2 border-elite-burgundy/10 flex items-center justify-center transition-all duration-300 hover:scale-105"
        aria-label={t("ariaLabel")}
      >
        <Bell className="w-5 h-5 text-elite-burgundy" />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -top-1 min-w-[22px] h-[22px] px-1 rounded-full bg-red-600 text-white text-[11px] leading-none font-bold flex items-center justify-center",
              isRTL ? "-left-1" : "-right-1",
            )}
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute mt-3 w-[340px] bg-white rounded-3xl shadow-2xl border border-elite-burgundy/15 z-50 overflow-hidden",
            isRTL ? "left-0" : "right-0",
          )}
        >
          <div className="px-4 py-3 border-b border-elite-burgundy/10 flex items-center justify-between">
            <h4 className="font-cabin font-bold text-elite-black">
              {t("title")}
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-elite-burgundy hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t("markAllRead")}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-sm text-elite-black/60">
                {t("loading")}
              </p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-elite-black/60">
                {t("empty")}
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="px-4 py-3 border-b border-elite-burgundy/5 hover:bg-elite-cream/40 transition-colors"
                >
                  <p className="text-sm font-semibold text-elite-black">
                    {notification.title}
                  </p>
                  <p className="text-sm text-elite-black/80 mt-0.5">
                    {notification.message}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-elite-black/50">
                      {formatRelative(notification.createdAt)}
                    </span>
                    <LocalizedLink
                      href="/menu"
                      className="text-xs font-semibold text-elite-burgundy hover:underline"
                    >
                      {t("viewMenu")}
                    </LocalizedLink>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
