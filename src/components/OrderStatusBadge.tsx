"use client";

import {
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useTranslations } from "next-intl";

export interface OrderStatusBadgeProps {
  status: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Badge component to display order status with appropriate styling
 */
export function OrderStatusBadge({
  status,
  label,
  size = "md",
}: OrderStatusBadgeProps) {
  const t = useTranslations("orderStatus");

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "synced":
      case "preparing":
      case "ready":
      case "out_for_delivery":
        return {
          icon: CheckCircle,
          color: "text-elite-cream",
          bg: "bg-elite-burgundy",
          border: "border-elite-burgundy",
          label: label || t("active"),
        };

      case "pending":
      case "processing":
        return {
          icon: Clock,
          color: "text-elite-black",
          bg: "bg-elite-cream",
          border: "border-elite-burgundy/20",
          label: label || t("pending"),
        };

      case "queued":
      case "syncing":
        return {
          icon: Loader2,
          color: "text-elite-burgundy",
          bg: "bg-elite-cream",
          border: "border-elite-burgundy/20",
          label: label || t("syncing"),
          animate: true,
        };

      case "completed":
      case "delivered":
        return {
          icon: CheckCircle,
          color: "text-elite-cream",
          bg: "bg-elite-burgundy",
          border: "border-elite-burgundy",
          label: label || t("delivered"),
        };

      case "failed":
      case "cancelled":
      case "error":
        return {
          icon: XCircle,
          color: "text-elite-black",
          bg: "bg-elite-cream",
          border: "border-elite-burgundy/20",
          label: label || t("cancelled"),
        };

      case "retry":
      case "retrying":
        return {
          icon: AlertTriangle,
          color: "text-elite-burgundy",
          bg: "bg-elite-cream",
          border: "border-elite-burgundy/20",
          label: label || t("retrying"),
        };

      default:
        return {
          icon: Clock,
          color: "text-elite-black",
          bg: "bg-elite-cream",
          border: "border-elite-burgundy/20",
          label: label || status,
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: {
      icon: "w-3 h-3",
      text: "text-xs",
      padding: "px-3 py-1.5",
      gap: "gap-1.5",
    },
    md: {
      icon: "w-4 h-4",
      text: "text-sm",
      padding: "px-4 py-2",
      gap: "gap-2",
    },
    lg: {
      icon: "w-5 h-5",
      text: "text-base",
      padding: "px-4 py-2",
      gap: "gap-2",
    },
  };

  const sizeClass = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center ${sizeClass.gap} ${sizeClass.padding} rounded-2xl border-2 ${config.bg} ${config.border} ${config.color} font-cabin font-bold ${sizeClass.text}`}
    >
      <Icon
        className={`${sizeClass.icon} ${config.animate ? "animate-spin" : ""}`}
      />
      {config.label}
    </span>
  );
}

/**
 * Component to show detailed Odoo integration status
 */
export interface OrderIntegrationStatusProps {
  integrationStatus?: {
    sale?: {
      synced: boolean;
      orderId?: number;
      status: string;
      url?: string;
    };
    pos?: {
      synced: boolean;
      orderId?: number;
      status: string;
    };
  };
}

export function OrderIntegrationStatus({
  integrationStatus,
}: OrderIntegrationStatusProps) {
  const t = useTranslations("orderStatus");

  if (!integrationStatus) return null;

  const { sale, pos } = integrationStatus;

  return (
    <div className="space-y-3">
      {/* Sale Order Status */}
      {sale && (
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              {t("integration.saleOrder")}
            </span>
            <OrderStatusBadge status={sale.status} size="sm" />
          </div>
          {sale.synced && sale.url && (
            <a
              href={sale.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {t("integration.viewInOdoo")}
            </a>
          )}
        </div>
      )}

      {/* POS Order Status */}
      {pos && (
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              {t("integration.kitchenDisplay")}
            </span>
            <OrderStatusBadge status={pos.status} size="sm" />
          </div>
          {pos.synced && pos.orderId && (
            <span className="text-xs text-gray-500 font-mono">
              {t("integration.posNumber", { id: pos.orderId })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
