"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, AlertCircle, ArrowRight, Home, Receipt, RefreshCw } from "lucide-react";
import Link from "next/link";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const orderId = searchParams.get("orderId");
  const status = searchParams.get("status"); // 'success', 'failed', 'cancelled'
  
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<{
    status: string;
    paymobTransactionId: string | null;
    amount: number;
    paidAt: Date | null;
    error: string | null;
  } | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const maxPollAttempts = 15; // 30 seconds max (15 * 2s)

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setPaymentStatus("unknown");
      return;
    }

    // Poll payment status
    const checkPaymentStatus = async () => {
      try {
        // Add timeout to status check
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds
        
        const res = await fetch(`/api/payments/status/${orderId}`, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const json = await res.json();
        
        if (json.success && json.data) {
          setPaymentStatus(json.data.status);
          setOrderData(json.data);
          
          // If payment is still pending, poll again (with limit)
          if (json.data.status === "pending" && pollCount < maxPollAttempts) {
            setPollCount((prev) => prev + 1);
            setTimeout(checkPaymentStatus, 2000); // Poll every 2 seconds
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("[Payment Callback] Error:", err);
        // Don't set error state on timeout - just stop polling
        if (err instanceof Error && err.name === "AbortError") {
          // Timeout - stop polling but don't show error
          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    };

    // Initial check
    checkPaymentStatus();

    // Also check URL status parameter
    if (status) {
      setPaymentStatus(status);
      if (status !== "pending") {
        setLoading(false);
      }
    }
  }, [orderId, status, pollCount]);

  // Loading state - matches design system
  if (loading) {
    return (
      <div className="min-h-screen bg-elite-cream flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-6 sm:p-8 md:p-10 lg:p-12 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-elite-burgundy/10 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-elite-burgundy animate-spin" />
          </div>
          <h2 className="font-calistoga text-elite-burgundy text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Checking Payment Status
          </h2>
          <p className="font-cabin text-elite-black/70 text-base sm:text-lg md:text-xl">
            Please wait while we verify your payment...
          </p>
        </div>
      </div>
    );
  }

  const isSuccess = paymentStatus === "success" || paymentStatus === "paid";
  const isFailed = paymentStatus === "failed" || paymentStatus === "cancelled" || paymentStatus === "error";
  const isPending = paymentStatus === "pending";
  const isUnknown = !paymentStatus || paymentStatus === "unknown";

  // Success state - matches design system
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-elite-cream flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-green-500" />
          </div>
          
          <h2 className="font-calistoga text-elite-burgundy text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-center">
            Payment Successful!
          </h2>
          
          <p className="font-cabin text-elite-black/70 text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-center">
            Your order has been confirmed and payment has been processed successfully.
          </p>

          {orderData?.amount && (
            <div className="bg-elite-cream/50 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8">
              <div className="flex justify-between items-center">
                <span className="font-cabin text-elite-black/70 text-base sm:text-lg">Amount Paid</span>
                <span className="font-calistoga text-elite-burgundy text-xl sm:text-2xl md:text-3xl font-bold">
                  {orderData.amount.toFixed(2)} EGP
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {orderId && (
              <Link
                href={`/orders/${orderId}`}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-elite-burgundy text-elite-cream rounded-3xl font-cabin text-base sm:text-lg font-semibold hover:bg-elite-burgundy/90 transition-all duration-300 active:scale-[0.98] touch-manipulation"
              >
                <Receipt className="w-5 h-5" />
                View Order
              </Link>
            )}
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-elite-burgundy text-elite-burgundy rounded-3xl font-cabin text-base sm:text-lg font-semibold hover:bg-elite-burgundy/5 transition-all duration-300 active:scale-[0.98] touch-manipulation"
            >
              <Home className="w-5 h-5" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Failed state - matches design system
  if (isFailed) {
    return (
      <div className="min-h-screen bg-elite-cream flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg">
            <XCircle className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-red-500" />
          </div>
          
          <h2 className="font-calistoga text-elite-burgundy text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-center">
            Payment {paymentStatus === "cancelled" ? "Cancelled" : "Failed"}
          </h2>
          
          <p className="font-cabin text-elite-black/70 text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-center">
            {paymentStatus === "cancelled"
              ? "Payment was cancelled. Your order is still pending and you can try again."
              : "Payment could not be processed. Please check your payment details and try again."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {orderId && (
              <Link
                href={`/order?retry=${orderId}`}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-elite-burgundy text-elite-cream rounded-3xl font-cabin text-base sm:text-lg font-semibold hover:bg-elite-burgundy/90 transition-all duration-300 active:scale-[0.98] touch-manipulation"
              >
                <RefreshCw className="w-5 h-5" />
                Retry Payment
              </Link>
            )}
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-elite-burgundy text-elite-burgundy rounded-3xl font-cabin text-base sm:text-lg font-semibold hover:bg-elite-burgundy/5 transition-all duration-300 active:scale-[0.98] touch-manipulation"
            >
              <Home className="w-5 h-5" />
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pending state - matches design system
  if (isPending) {
    return (
      <div className="min-h-screen bg-elite-cream flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-yellow-50 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg">
            <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-yellow-500" />
          </div>
          
          <h2 className="font-calistoga text-elite-burgundy text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-center">
            Payment Pending
          </h2>
          
          <p className="font-cabin text-elite-black/70 text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-center">
            Your payment is being processed. This may take a few moments. Please do not close this page.
          </p>

          <div className="flex justify-center mb-6 sm:mb-8">
            <Loader2 className="w-8 h-8 text-elite-burgundy animate-spin" />
          </div>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-elite-burgundy text-elite-burgundy rounded-3xl font-cabin text-base sm:text-lg font-semibold hover:bg-elite-burgundy/5 transition-all duration-300 active:scale-[0.98] touch-manipulation"
          >
            <Home className="w-5 h-5" />
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // Unknown/Error state
  return (
    <div className="min-h-screen bg-elite-cream flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-6 sm:p-8 md:p-10 lg:p-12">
        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-elite-burgundy/10 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg">
          <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-elite-burgundy" />
        </div>
        
        <h2 className="font-calistoga text-elite-burgundy text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-center">
          Payment Status Unknown
        </h2>
        
        <p className="font-cabin text-elite-black/70 text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-center">
          We couldn't determine your payment status. Please check your order history or contact support.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {orderId && (
            <Link
              href={`/orders/${orderId}`}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-elite-burgundy text-elite-cream rounded-3xl font-cabin text-base sm:text-lg font-semibold hover:bg-elite-burgundy/90 transition-all duration-300 active:scale-[0.98] touch-manipulation"
            >
              <Receipt className="w-5 h-5" />
              Check Order
            </Link>
          )}
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-elite-burgundy text-elite-burgundy rounded-3xl font-cabin text-base sm:text-lg font-semibold hover:bg-elite-burgundy/5 transition-all duration-300 active:scale-[0.98] touch-manipulation"
          >
            <Home className="w-5 h-5" />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-elite-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-elite-burgundy/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Loader2 className="w-10 h-10 text-elite-burgundy animate-spin" />
          </div>
          <p className="font-calistoga text-elite-burgundy text-2xl font-bold">Loading...</p>
        </div>
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}
