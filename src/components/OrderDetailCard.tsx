"use client";

import { useOrderStatus } from "@/hooks/useOrderStatus";
import { OrderStatusBadge, OrderIntegrationStatus } from "./OrderStatusBadge";
import { Loader2, Package, Clock, MapPin, CreditCard, FileText } from "lucide-react";
import { useEffect, useState } from "react";

interface OrderDetailCardProps {
  orderId: string;
  enablePolling?: boolean;
  pollInterval?: number;
}

/**
 * Component to display order details with real-time status updates
 */
export function OrderDetailCard({ orderId, enablePolling = true, pollInterval = 5000 }: OrderDetailCardProps) {
  const { status, loading, error, isPolling } = useOrderStatus({
    orderId,
    pollInterval,
    enabled: enablePolling,
    // Stop polling when both sale and POS are synced (or failed)
    stopWhen: (s) => {
      const saleComplete = s.odooStatusSale === "synced" || s.odooStatusSale === "failed";
      const posComplete = s.odooStatusPos === "synced" || s.odooStatusPos === "failed" || s.odooStatusPos === "pending";
      return saleComplete && posComplete;
    },
  });

  const [showPollingIndicator, setShowPollingIndicator] = useState(false);

  // Show polling indicator after first load
  useEffect(() => {
    if (!loading && isPolling) {
      setShowPollingIndicator(true);
    } else {
      setShowPollingIndicator(false);
    }
  }, [loading, isPolling]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-elite-burgundy animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <p className="text-red-800 font-cabin text-center">{error}</p>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header with Status */}
      <div className="bg-gradient-to-r from-elite-burgundy to-elite-dark-burgundy text-elite-cream p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-calistoga text-2xl mb-1">Order #{status.id.slice(0, 8)}</h3>
            <p className="text-elite-cream/80 text-sm font-cabin">
              {new Date().toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <OrderStatusBadge status={status.status} size="lg" />
        </div>

        {/* Polling Indicator */}
        {showPollingIndicator && (
          <div className="flex items-center gap-2 text-elite-cream/70 text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Checking status...</span>
          </div>
        )}
      </div>

      {/* Order Details */}
      <div className="p-6 space-y-4">
        {/* Payment Info */}
        <div className="flex items-center gap-3 text-gray-700">
          <CreditCard className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium">Payment</p>
            <p className="text-xs text-gray-500">{status.paymentStatus} • {status.paymentStatus === "PAID" ? "Paid" : "Pending"}</p>
          </div>
        </div>

        {/* Order Type */}
        <div className="flex items-center gap-3 text-gray-700">
          {status.status === "DELIVERY" ? (
            <MapPin className="w-5 h-5 text-gray-400" />
          ) : (
            <Package className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <p className="text-sm font-medium">Order Type</p>
            <p className="text-xs text-gray-500 capitalize">{status.status}</p>
          </div>
        </div>

        {/* Odoo Integration Status */}
        {status.integrationStatus && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">Integration Status</p>
            </div>
            <OrderIntegrationStatus integrationStatus={status.integrationStatus} />
          </div>
        )}

        {/* Sync Status Details */}
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Odoo Sale</p>
              <OrderStatusBadge status={status.odooStatusSale} size="sm" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Kitchen Display</p>
              <OrderStatusBadge status={status.odooStatusPos} size="sm" />
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {status.saleOrderId && (
          <div className="pt-4 border-t border-gray-200 text-xs text-gray-500 font-mono">
            Sale Order ID: {status.saleOrderId}
            {status.odooWebUrl && (
              <>
                {" • "}
                <a
                  href={status.odooWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  View in Odoo
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


