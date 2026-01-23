"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CreditCard,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Shield,
  Lock,
  Wallet,
  Receipt,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";

function PaymentProcessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { push } = useToast();

  const orderId = searchParams.get("orderId");
  const paymentKey = searchParams.get("paymentKey");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{
    total?: number;
    orderNumber?: string;
    paymentMethod?: string;
  } | null>(null);
  const [iframeConfig, setIframeConfig] = useState<{
    iframeId?: string;
  } | null>(null);

  // Fetch order info and iframe config
  useEffect(() => {
    if (orderId) {
      Promise.all([
        fetch(`/api/orders/${orderId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              setOrderInfo({
                total: data.data.total,
                orderNumber: data.data.orderNumber || data.data.clientOrderRef,
                paymentMethod: data.data.paymentMethod,
              });
            }
          })
          .catch(() => {
            // Silently fail - order info is optional
          }),
        fetch("/api/payments/config")
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              setIframeConfig({
                iframeId: data.data.iframeId,
              });
            }
          })
          .catch(() => {
            // Silently fail - will use default iframe ID
          }),
      ]).catch(() => {
        // Ignore errors
      });
    }
  }, [orderId]);

  const initializePayment = useCallback(() => {
    if (!orderId || !paymentKey) {
      setError(
        "Missing payment information. Please return to checkout and try again.",
      );
      setLoading(false);
      return;
    }

    try {
      // Payment is ready when iframe loads
      setLoading(false);
      setProcessing(true);
    } catch (err: unknown) {
      console.error("[Payment] Initialization error:", err);
      setError("Payment could not be initialized. Please try again.");
      setLoading(false);
    }
  }, [orderId, paymentKey]);

  useEffect(() => {
    if (!orderId || !paymentKey) {
      setError("Missing order ID or payment key. Please return to checkout.");
      setLoading(false);
      return;
    }

    // Initialize payment (iframe-based, no SDK needed)
    initializePayment();
  }, [orderId, paymentKey, initializePayment]);

  // Build iframe URL
  const iframeId = iframeConfig?.iframeId || process.env.NEXT_PUBLIC_PAYMOB_IFRAME_ID || "983628";
  const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`;

  // Handle payment completion via iframe message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin
      if (!event.origin.includes("paymob.com")) {
        return;
      }

      // Handle payment completion
      if (event.data?.type === "payment_success" || event.data?.success === true) {
        router.push(`/payment/callback?orderId=${orderId}&status=success`);
      } else if (event.data?.type === "payment_failed" || event.data?.success === false) {
        router.push(`/payment/callback?orderId=${orderId}&status=failed`);
      } else if (event.data?.type === "payment_cancelled") {
        router.push(`/payment/callback?orderId=${orderId}&status=cancelled`);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [orderId, router]);

  // Loading state - matches order page design
  if (loading) {
    return (
      <div className="min-h-screen bg-elite-cream flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-6 sm:p-8 md:p-10 lg:p-12 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-elite-burgundy/10 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-elite-burgundy animate-spin" />
          </div>
          <h2 className="font-calistoga text-elite-burgundy text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Initializing Payment
          </h2>
          <p className="font-cabin text-elite-black/70 text-base sm:text-lg md:text-xl">
            Please wait while we prepare your secure payment form...
          </p>
        </div>
      </div>
    );
  }

  // Error state - matches order page design
  if (error) {
    return (
      <div className="min-h-screen bg-elite-cream flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg">
            <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-red-500" />
          </div>

          <h2 className="font-calistoga text-elite-burgundy text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-center">
            Payment Error
          </h2>

          <p className="font-cabin text-elite-black/70 text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-center">
            {error}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/order"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-elite-burgundy text-elite-cream rounded-3xl font-cabin text-base sm:text-lg font-semibold hover:bg-elite-burgundy/90 transition-all duration-300 active:scale-[0.98] touch-manipulation"
            >
              <ArrowLeft className="w-5 h-5" />
              Return to Checkout
            </Link>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                initializePayment();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-elite-burgundy text-elite-burgundy rounded-3xl font-cabin text-base sm:text-lg font-semibold hover:bg-elite-burgundy/5 transition-all duration-300 active:scale-[0.98] touch-manipulation"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment form state - matches order page design
  return (
    <div className="min-h-screen bg-elite-cream py-6 sm:py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/order"
            className="inline-flex items-center gap-2 text-elite-burgundy font-cabin font-semibold hover:text-elite-burgundy/80 transition-colors mb-4 sm:mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Checkout
          </Link>

          <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-4 sm:p-6 md:p-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-elite-burgundy rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg">
                {orderInfo?.paymentMethod === "WALLET" ? (
                  <Wallet className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-elite-cream" />
                ) : (
                  <CreditCard className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-elite-cream" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-calistoga text-elite-burgundy text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">
                  Complete Payment
                </h1>
                {orderInfo?.orderNumber && (
                  <p className="font-cabin text-elite-black/60 text-sm sm:text-base">
                    Order #{orderInfo.orderNumber}
                  </p>
                )}
                {orderInfo?.paymentMethod && (
                  <p className="font-cabin text-elite-black/50 text-xs sm:text-sm mt-1">
                    {orderInfo.paymentMethod === "WALLET"
                      ? "Mobile Wallet Payment"
                      : orderInfo.paymentMethod === "CARD"
                        ? "Card Payment"
                        : "Secure Payment"}
                  </p>
                )}
              </div>
            </div>

            {orderInfo?.total && (
              <div className="bg-elite-cream/50 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8">
                <div className="flex justify-between items-center">
                  <span className="font-cabin text-elite-black/70 text-base sm:text-lg">
                    Total Amount
                  </span>
                  <span className="font-calistoga text-elite-burgundy text-xl sm:text-2xl md:text-3xl font-bold">
                    {orderInfo.total.toFixed(2)} EGP
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Form Container */}
        <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-4 sm:p-6 md:p-8 lg:p-10">
          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            <Shield className="w-5 h-5 text-elite-burgundy" />
            <span className="font-cabin text-elite-black/70 text-sm sm:text-base">
              Secure payment powered by Paymob
            </span>
            <Lock className="w-4 h-4 text-elite-burgundy" />
          </div>

          {processing && paymentKey && (
            <div className="space-y-4 sm:space-y-6">
              <p className="font-cabin text-elite-black/70 text-base sm:text-lg text-center">
                Please complete your payment using the secure form below.
              </p>

              {/* Paymob iframe - branded custom iframe */}
              <div className="w-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px] border-2 border-elite-burgundy/10 rounded-3xl bg-white overflow-hidden">
                <iframe
                  src={iframeUrl}
                  className="w-full h-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px] border-0 rounded-3xl"
                  title="Payment Form"
                  allow="payment; fullscreen"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
                  loading="lazy"
                />
              </div>

              {/* Manual completion action (some Paymob flows don't postMessage to parent reliably) */}
              {orderId && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-elite-burgundy text-elite-cream rounded-3xl font-cabin text-base sm:text-lg font-semibold hover:bg-elite-burgundy/90 transition-all duration-300 active:scale-[0.98] touch-manipulation"
                    onClick={() => router.push(`/payment/callback?orderId=${orderId}`)}
                  >
                    <Receipt className="w-5 h-5" />
                    I&apos;ve Completed Payment
                  </button>
                  <Link
                    href={`/orders/${orderId}`}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-elite-burgundy text-elite-burgundy rounded-3xl font-cabin text-base sm:text-lg font-semibold hover:bg-elite-burgundy/5 transition-all duration-300 active:scale-[0.98] touch-manipulation"
                  >
                    <Receipt className="w-5 h-5" />
                    View Order
                  </Link>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-elite-black/50 text-xs sm:text-sm font-cabin">
                <Lock className="w-3 h-3" />
                <span>Your payment information is encrypted and secure</span>
                <Shield className="w-3 h-3" />
              </div>

              {/* Payment method info */}
              <div className="bg-elite-cream/30 rounded-2xl p-4 text-center">
                <p className="font-cabin text-elite-black/60 text-sm">
                  {orderInfo?.paymentMethod === "WALLET"
                    ? "You can pay using Vodafone Cash, Orange Money, or Etisalat Wallet"
                    : orderInfo?.paymentMethod === "CARD"
                      ? "Credit/Debit cards and installments are accepted"
                      : "Secure payment powered by Paymob"}
                </p>
              </div>
            </div>
          )}

          {!processing && (
            <div className="text-center py-8 sm:py-12">
              <Loader2 className="w-12 h-12 animate-spin text-elite-burgundy mx-auto mb-4" />
              <p className="font-cabin text-elite-black/70">
                Preparing payment form...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentProcessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-elite-cream flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-elite-burgundy/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Loader2 className="w-10 h-10 text-elite-burgundy animate-spin" />
            </div>
            <p className="font-calistoga text-elite-burgundy text-2xl font-bold">
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <PaymentProcessContent />
    </Suspense>
  );
}
