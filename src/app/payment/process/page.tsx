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
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import LocalizedLink from "@/components/LocalizedLink";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { addLocaleToPathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

function PaymentProcessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { push } = useToast();
  const t = useTranslations("paymentProcess");
  const format = useFormatter();
  const locale = useLocale();
  const isRTL = locale === "ar";
  const orderPath = addLocaleToPathname("/order", locale);
  const paymentCallbackPath = addLocaleToPathname("/payment/callback", locale);
  const formatCurrency = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 2,
    });

  const orderId = searchParams.get("orderId");
  const paymentKey = searchParams.get("paymentKey");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [opened, setOpened] = useState(false);
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
        t("errors.missingPaymentInfo"),
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
      setError(t("errors.initFailed"));
      setLoading(false);
    }
  }, [orderId, paymentKey, t]);

  useEffect(() => {
    if (!orderId || !paymentKey) {
      setError(t("errors.missingOrderInfo"));
      setLoading(false);
      return;
    }

    // Initialize payment (iframe-based, no SDK needed)
    initializePayment();
  }, [orderId, paymentKey, initializePayment, t]);

  // Build iframe URL
  const iframeId = iframeConfig?.iframeId || process.env.NEXT_PUBLIC_PAYMOB_IFRAME_ID || "983628";
  const paymobCheckoutUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`;

  // Loading state - matches order page design
  if (loading) {
    return (
      <div className="min-h-screen bg-elite-cream flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-6 sm:p-8 md:p-10 lg:p-12 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-elite-burgundy/10 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-elite-burgundy animate-spin" />
          </div>
          <h2 className="font-calistoga text-elite-burgundy text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            {t("loading.title")}
          </h2>
          <p className="font-cabin text-elite-black/70 text-base sm:text-lg md:text-xl">
            {t("loading.description")}
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
            {t("error.title")}
          </h2>

          <p className="font-cabin text-elite-black/70 text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-center">
            {error}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <LocalizedLink
              href={orderPath}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-elite-burgundy text-elite-cream rounded-3xl font-cabin text-base sm:text-lg font-semibold hover:bg-elite-burgundy/90 transition-all duration-300 active:scale-[0.98] touch-manipulation"
            >
              <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
              {t("error.back")}
            </LocalizedLink>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                initializePayment();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-elite-burgundy text-elite-burgundy rounded-3xl font-cabin text-base sm:text-lg font-semibold hover:bg-elite-burgundy/5 transition-all duration-300 active:scale-[0.98] touch-manipulation"
            >
              {t("error.retry")}
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
          <LocalizedLink
            href={orderPath}
            className="inline-flex items-center gap-2 text-elite-burgundy font-cabin font-semibold hover:text-elite-burgundy/80 transition-colors mb-4 sm:mb-6"
          >
            <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
            {t("backToCheckout")}
          </LocalizedLink>

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
                  {t("title")}
                </h1>
                {orderInfo?.orderNumber && (
                  <p className="font-cabin text-elite-black/60 text-sm sm:text-base">
                    {t("orderNumber", { number: orderInfo.orderNumber })}
                  </p>
                )}
                {orderInfo?.paymentMethod && (
                  <p className="font-cabin text-elite-black/50 text-xs sm:text-sm mt-1">
                    {orderInfo.paymentMethod === "WALLET"
                      ? t("method.wallet")
                      : orderInfo.paymentMethod === "CARD"
                        ? t("method.card")
                        : t("method.secure")}
                  </p>
                )}
              </div>
            </div>

            {orderInfo?.total && (
              <div className="bg-elite-cream/50 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8">
                <div className="flex justify-between items-center">
                  <span className="font-cabin text-elite-black/70 text-base sm:text-lg">
                    {t("totalAmount")}
                  </span>
                  <span className="font-calistoga text-elite-burgundy text-xl sm:text-2xl md:text-3xl font-bold">
                    {formatCurrency(orderInfo.total)}
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
              {t("secureBadge")}
            </span>
            <Lock className="w-4 h-4 text-elite-burgundy" />
          </div>

          {processing && paymentKey && (
            <div className="space-y-4 sm:space-y-6">
              <p className="font-cabin text-elite-black/70 text-base sm:text-lg text-center">
                {t("processing.description")}
              </p>

              {/* No embedded iframe: open Paymob hosted checkout */}
              <div className="bg-elite-cream/30 rounded-3xl p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-elite-burgundy text-elite-cream rounded-3xl font-cabin text-base sm:text-lg font-semibold hover:bg-elite-burgundy/90 transition-all duration-300 active:scale-[0.98] touch-manipulation"
                    onClick={() => {
                      // Open in a new tab to avoid embedding while keeping this page available
                      // for status verification and the "I've completed payment" action.
                      window.open(paymobCheckoutUrl, "_blank", "noopener,noreferrer");
                      setOpened(true);
                      push({
                        type: "success",
                        message: t("processing.openedToast"),
                      });
                    }}
                  >
                    <ExternalLink className="w-5 h-5" />
                    {t("processing.openButton")}
                  </button>

                  <a
                    href={paymobCheckoutUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-elite-burgundy text-elite-burgundy rounded-3xl font-cabin text-base sm:text-lg font-semibold hover:bg-elite-burgundy/5 transition-all duration-300 active:scale-[0.98] touch-manipulation"
                  >
                    <ExternalLink className="w-5 h-5" />
                    {t("processing.fallbackLink")}
                  </a>
                </div>

                <div className="mt-4 text-center font-cabin text-xs sm:text-sm text-elite-black/60">
                  {opened
                    ? t("processing.returnAfterPayment")
                    : t("processing.keepOpen")}
                </div>
              </div>

              {/* Manual completion action (some Paymob flows don't postMessage to parent reliably) */}
              {orderId && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-elite-burgundy text-elite-cream rounded-3xl font-cabin text-base sm:text-lg font-semibold hover:bg-elite-burgundy/90 transition-all duration-300 active:scale-[0.98] touch-manipulation"
                    onClick={() =>
                      router.push(
                        `${paymentCallbackPath}?orderId=${orderId}`,
                      )
                    }
                  >
                    <Receipt className="w-5 h-5" />
                    {t("processing.completedButton")}
                  </button>
                  <LocalizedLink
                    href={`/orders/${orderId}`}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-elite-burgundy text-elite-burgundy rounded-3xl font-cabin text-base sm:text-lg font-semibold hover:bg-elite-burgundy/5 transition-all duration-300 active:scale-[0.98] touch-manipulation"
                  >
                    <Receipt className="w-5 h-5" />
                    {t("processing.viewOrder")}
                  </LocalizedLink>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-elite-black/50 text-xs sm:text-sm font-cabin">
                <Lock className="w-3 h-3" />
                <span>{t("processing.encrypted")}</span>
                <Shield className="w-3 h-3" />
              </div>

              {/* Payment method info */}
              <div className="bg-elite-cream/30 rounded-2xl p-4 text-center">
                <p className="font-cabin text-elite-black/60 text-sm">
                  {orderInfo?.paymentMethod === "WALLET"
                    ? t("processing.walletInfo")
                    : orderInfo?.paymentMethod === "CARD"
                      ? t("processing.cardInfo")
                      : t("secureBadge")}
                </p>
              </div>
            </div>
          )}

          {!processing && (
            <div className="text-center py-8 sm:py-12">
              <Loader2 className="w-12 h-12 animate-spin text-elite-burgundy mx-auto mb-4" />
              <p className="font-cabin text-elite-black/70">
                {t("processing.preparing")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentProcessPage() {
  const t = useTranslations("paymentProcess");
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-elite-cream flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-elite-burgundy/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Loader2 className="w-10 h-10 text-elite-burgundy animate-spin" />
            </div>
            <p className="font-calistoga text-elite-burgundy text-2xl font-bold">
              {t("loading.fallback")}
            </p>
          </div>
        </div>
      }
    >
      <PaymentProcessContent />
    </Suspense>
  );
}
