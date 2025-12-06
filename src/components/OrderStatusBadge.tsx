"use client";

import { CheckCircle, Clock, XCircle, Loader2, AlertTriangle } from "lucide-react";

export interface OrderStatusBadgeProps {
  status: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Badge component to display order status with appropriate styling
 */
export function OrderStatusBadge({ status, label, size = "md" }: OrderStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "synced":
      case "completed":
      case "delivered":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bg: "bg-green-50",
          border: "border-green-200",
          label: label || "Confirmed",
        };
      
      case "pending":
      case "processing":
        return {
          icon: Clock,
          color: "text-amber-600",
          bg: "bg-amber-50",
          border: "border-amber-200",
          label: label || "Processing",
        };
      
      case "queued":
      case "syncing":
        return {
          icon: Loader2,
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-200",
          label: label || "Syncing",
          animate: true,
        };
      
      case "failed":
      case "cancelled":
      case "error":
        return {
          icon: XCircle,
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
          label: label || "Failed",
        };
      
      case "retry":
      case "retrying":
        return {
          icon: AlertTriangle,
          color: "text-orange-600",
          bg: "bg-orange-50",
          border: "border-orange-200",
          label: label || "Retrying",
        };
      
      default:
        return {
          icon: Clock,
          color: "text-gray-600",
          bg: "bg-gray-50",
          border: "border-gray-200",
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
      padding: "px-2 py-1",
      gap: "gap-1",
    },
    md: {
      icon: "w-4 h-4",
      text: "text-sm",
      padding: "px-3 py-1.5",
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
      className={`inline-flex items-center ${sizeClass.gap} ${sizeClass.padding} rounded-full border ${config.bg} ${config.border} ${config.color} font-cabin font-medium ${sizeClass.text}`}
    >
      <Icon className={`${sizeClass.icon} ${config.animate ? "animate-spin" : ""}`} />
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

export function OrderIntegrationStatus({ integrationStatus }: OrderIntegrationStatusProps) {
  if (!integrationStatus) return null;

  const { sale, pos } = integrationStatus;

  return (
    <div className="space-y-3">
      {/* Sale Order Status */}
      {sale && (
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Sale Order:</span>
            <OrderStatusBadge status={sale.status} size="sm" />
          </div>
          {sale.synced && sale.url && (
            <a
              href={sale.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              View in Odoo →
            </a>
          )}
        </div>
      )}

      {/* POS Order Status */}
      {pos && (
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Kitchen Display:</span>
            <OrderStatusBadge status={pos.status} size="sm" />
          </div>
          {pos.synced && pos.orderId && (
            <span className="text-xs text-gray-500 font-mono">
              POS #{pos.orderId}
            </span>
          )}
        </div>
      )}
    </div>
  );
}


