"use client";
import React from "react";
import type { Order, OrderType, Address } from "@/types";
import { PaymentMethod } from "@/types";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/Skeleton";
import { useLocalCart, type LocalCartItem } from "@/hooks/useLocalCart";
import { useAddresses } from "@/hooks/useAddresses";
import Footer from "@/components/Footer";
import AddressManager from "@/components/AddressManager";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { mapPaymentMethodToPaymob } from "@/types/payments";
import { getLocalProductImageCandidates } from "@/lib/imageUtils";
import {
  ShoppingBag,
  ChevronRight,
  Minus,
  Plus,
  Trash2,
  MapPin,
  Store,
  Truck,
  Check,
  Receipt,
  CreditCard,
  AlertCircle,
  ExternalLink,
  Wallet,
  Smartphone,
  Coffee,
} from "lucide-react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import LocalizedLink from "@/components/LocalizedLink";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { addLocaleToPathname } from "@/i18n/routing";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";
import { cn } from "@/lib/utils";

function OrderPageContent() {
  const t = useTranslations("order");
  const format = useFormatter();
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { data: session, status: sessionStatus } = useSession();
  const localizedRouter = useLocalizedRouter();
  const searchParams = useSearchParams();

  // Redirect unauthenticated users to sign-in
  React.useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      const callbackUrl = addLocaleToPathname("/order", locale);
      localizedRouter.push(
        `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      );
    }
  }, [sessionStatus, locale, localizedRouter]);
  const {
    items: cartItems,
    isLoading: loading,
    removeItem: removeFromCart,
    updateQuantity,
    clearCart,
    subtotal: localSubtotal,
    itemCount: localItemCount,
  } = useLocalCart();

  // Map local cart to expected shape
  const cart = { items: cartItems };
  const error = null;
  const isUpdating = false;
  const refreshCart = async () => {};

  const { addresses, defaultAddress } = useAddresses();

  const [orderType, setOrderType] = React.useState<OrderType>(
    "PICKUP" as OrderType,
  );
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(
    PaymentMethod.CASH,
  );
  const [selectedAddress, setSelectedAddress] = React.useState<Address | null>(
    null,
  );
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [lastOrder, setLastOrder] = React.useState<Order | null>(null);
  const [pendingPaymentOrder, setPendingPaymentOrder] =
    React.useState<Order | null>(null);
  const { push } = useToast();

  const formatCurrency = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 2,
    });

  const orderTypeLabel = (type: OrderType) =>
    type === "DELIVERY" ? t("orderType.delivery") : t("orderType.pickup");

  const paymentMethodLabel = (method: PaymentMethod | string) => {
    if (method === PaymentMethod.WALLET) return t("payment.wallet");
    if (method === PaymentMethod.CARD) return t("payment.card");
    if (method === PaymentMethod.CASH) return t("payment.cash");
    return String(method);
  };

  const paymentMethodDescription = (method: PaymentMethod) => {
    return method === PaymentMethod.WALLET
      ? t("payment.walletDescription")
      : t("payment.cardDescription");
  };

  const orderCallbackUrl = addLocaleToPathname("/order", locale);

  const [checkoutConfig, setCheckoutConfig] = React.useState<{
    enabledPaymentMethods: PaymentMethod[];
    deliveryFee: number;
    codFee: number;
    orderingEnabled: boolean;
  }>({
    enabledPaymentMethods: [
      PaymentMethod.CARD,
      PaymentMethod.WALLET,
      PaymentMethod.CASH,
    ],
    deliveryFee: 15,
    codFee: 0,
    orderingEnabled: true,
  });

  React.useEffect(() => {
    let cancelled = false;
    async function loadConfig() {
      try {
        const res = await fetch("/api/checkout/config", {
          credentials: "include",
        });
        if (!res.ok) return;
        const json = await res.json();
        const data = (json?.data || json) as {
          enabledPaymentMethods?: PaymentMethod[];
          deliveryFee?: number;
          codFee?: number;
          orderingEnabled?: boolean;
        };
        if (cancelled) return;
        if (
          Array.isArray(data.enabledPaymentMethods) &&
          data.enabledPaymentMethods.length > 0
        ) {
          setCheckoutConfig({
            enabledPaymentMethods: data.enabledPaymentMethods,
            deliveryFee:
              typeof data.deliveryFee === "number" ? data.deliveryFee : 15,
            codFee: typeof data.codFee === "number" ? data.codFee : 0,
            orderingEnabled:
              typeof data.orderingEnabled === "boolean"
                ? data.orderingEnabled
                : true,
          });
        }
      } catch {
        // Keep defaults
      }
    }
    loadConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  // If backend disables the currently selected method, fall back.
  React.useEffect(() => {
    if (checkoutConfig.enabledPaymentMethods.length === 0) return;
    if (!checkoutConfig.enabledPaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(
        checkoutConfig.enabledPaymentMethods[0] || PaymentMethod.CARD,
      );
    }
  }, [checkoutConfig.enabledPaymentMethods, paymentMethod]);

  const isCheckoutEnabled = checkoutConfig.enabledPaymentMethods.length > 0;

  const isOnlinePayment =
    paymentMethod === PaymentMethod.CARD ||
    paymentMethod === PaymentMethod.WALLET;
  const needsAddressForPayment = isOnlinePayment;
  const requiresPhoneForOrder = orderType === "DELIVERY" || isOnlinePayment;
  const hasAuthForOnlinePayment = Boolean(session?.user?.email);
  const hasPhoneForOnlinePayment = Boolean(selectedAddress?.phone);

  const placeOrderBlockReason = React.useMemo(() => {
    if (submitting || isUpdating) return null;
    if (!isCheckoutEnabled) return t("errors.checkoutUnavailable");
    if (!cartItems || cartItems.length === 0) return t("errors.cartEmpty");
    if (orderType === "DELIVERY" && !selectedAddress)
      return t("errors.selectDeliveryAddress");
    if (needsAddressForPayment && !selectedAddress)
      return t("errors.selectBillingAddress");
    if (isOnlinePayment && !hasAuthForOnlinePayment)
      return t("errors.signInToPay");
    if (requiresPhoneForOrder && !hasPhoneForOnlinePayment)
      return t("errors.addPhone");
    return null;
  }, [
    submitting,
    isUpdating,
    isCheckoutEnabled,
    cartItems,
    orderType,
    selectedAddress,
    needsAddressForPayment,
    isOnlinePayment,
    requiresPhoneForOrder,
    hasAuthForOnlinePayment,
    hasPhoneForOnlinePayment,
    t,
  ]);

  const isPlaceOrderDisabled =
    submitting || isUpdating || Boolean(placeOrderBlockReason);

  const paymentMethodsGridClass =
    checkoutConfig.enabledPaymentMethods.length === 1
      ? "grid gap-3 md:gap-4 grid-cols-1"
      : "grid gap-3 md:gap-4 sm:grid-cols-2";

  // Auto-select default address when switching to delivery or online payment
  React.useEffect(() => {
    if (
      (orderType === "DELIVERY" || needsAddressForPayment) &&
      defaultAddress &&
      !selectedAddress
    ) {
      setSelectedAddress(defaultAddress);
    }
  }, [orderType, defaultAddress, selectedAddress, needsAddressForPayment]);

  const retryPaymentForOrder = React.useCallback(
    async (orderId: string) => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        const orderRes = await fetch(`/api/orders/${orderId}`, {
          credentials: "include",
        });
        const orderJson = await orderRes.json();
        const order = (orderJson?.data || orderJson) as {
          paymentMethod?: string;
        };
        const method = order?.paymentMethod || PaymentMethod.CARD;
        const paymobMethod = mapPaymentMethodToPaymob(method);

        const res = await fetch("/api/payments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            orderId,
            paymentMethod: paymobMethod,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json?.success || !json?.data?.paymentKey) {
          const msg = json?.error || t("errors.paymentInitOrCash");
          throw new Error(msg);
        }

        clearCart();
        localizedRouter.push(
          `/payment/process?orderId=${orderId}&paymentKey=${json.data.paymentKey}`,
        );
      } catch (e) {
        const msg =
          e instanceof Error && e.message ? e.message : t("errors.paymentInit");
        setSubmitError(msg);
        push({ type: "error", message: msg });
      } finally {
        setSubmitting(false);
      }
    },
    [clearCart, push, t, localizedRouter],
  );

  // Handle retry flow from /payment/callback "Retry Payment" link.
  React.useEffect(() => {
    const retryOrderId = searchParams?.get("retry");
    if (!retryOrderId) return;
    // Fire-and-forget; errors shown via submitError/toast.
    retryPaymentForOrder(retryOrderId);
  }, [searchParams, retryPaymentForOrder]);

  const placeOrder = async () => {
    setSubmitting(true);
    setSubmitError(null);
    setLastOrder(null);
    setPendingPaymentOrder(null);

    if (!isCheckoutEnabled) {
      setSubmitError(t("errors.checkoutUnavailable"));
      setSubmitting(false);
      push({
        type: "error",
        message: t("errors.checkoutUnavailable"),
      });
      return;
    }

    // Validate cart has items
    if (!cartItems || cartItems.length === 0) {
      setSubmitError(t("errors.cartEmpty"));
      setSubmitting(false);
      push({
        type: "error",
        message: t("errors.cartEmpty"),
      });
      return;
    }

    // Validate address for delivery orders
    if (orderType === "DELIVERY" && !selectedAddress) {
      setSubmitError(t("errors.selectDeliveryAddress"));
      setSubmitting(false);
      push({ type: "error", message: t("errors.selectDeliveryAddress") });
      return;
    }

    // Online payment requires auth + billing details (Paymob requires email, phone, address)
    if (isOnlinePayment && !hasAuthForOnlinePayment) {
      setSubmitError(t("errors.signInToPay"));
      setSubmitting(false);
      push({ type: "error", message: t("errors.signInToPay") });
      return;
    }
    if (needsAddressForPayment && !selectedAddress) {
      setSubmitError(t("errors.selectBillingAddress"));
      setSubmitting(false);
      push({
        type: "error",
        message: t("errors.selectBillingAddress"),
      });
      return;
    }
    if (requiresPhoneForOrder && !hasPhoneForOnlinePayment) {
      setSubmitError(t("errors.addPhone"));
      setSubmitting(false);
      push({
        type: "error",
        message: t("errors.addPhone"),
      });
      return;
    }

    try {
      const partnerName =
        session?.user?.name ||
        session?.user?.email?.split("@")[0] ||
        t("partnerFallback");
      // Add timeout to order creation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for NextAuth
        signal: controller.signal,
        body: JSON.stringify({
          paymentMethod,
          orderType,
          addressId:
            orderType === "DELIVERY" || isOnlinePayment
              ? selectedAddress?.id
              : undefined,
          notes,
          items: cartItems, // Send cart items from localStorage
          odoo: {
            partner: {
              name: partnerName,
              email: session?.user?.email || undefined,
              phone: selectedAddress?.phone || undefined,
            },
            sale: { enable: true, autoConfirm: false },
            pos: {
              enable: false,
              posConfigName: undefined,
            },
          },
        }),
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || t("errors.placeOrder");
        throw new Error(errorMessage);
      }
      const json = await res.json();
      const orderData = json.data;

      // Check if payment intent was created (for online payments)
      if (
        orderData.paymentIntent &&
        (paymentMethod === PaymentMethod.CARD ||
          paymentMethod === PaymentMethod.WALLET)
      ) {
        clearCart(); // Order is created; cart should not remain after redirecting to payment
        // Redirect to payment page
        localizedRouter.push(
          `/payment/process?orderId=${orderData.order.id}&paymentKey=${orderData.paymentIntent.paymentKey}`,
        );
        return;
      }

      // Online payment selected but no payment intent returned: don't pretend we're done.
      if (
        paymentMethod === PaymentMethod.CARD ||
        paymentMethod === PaymentMethod.WALLET
      ) {
        const createdOrder = orderData.order || orderData;
        setPendingPaymentOrder(createdOrder);
        const msg =
          orderData.paymentIntentError ||
          "We created your order, but payment could not be initialized. Please retry payment.";
        setSubmitError(msg);
        push({ type: "error", message: msg });
        return;
      }

      setLastOrder(orderData.order || orderData);
      push({ type: "success", message: t("success.orderPlaced") });
      clearCart(); // Clear local cart after successful order
    } catch (e) {
      let msg = t("errors.placeOrder");

      if (e instanceof Error) {
        if (e.name === "AbortError" || e.message.includes("timeout")) {
          msg = t("errors.requestTimeout");
        } else if (
          e.message.includes("rate limit") ||
          e.message.includes("Too many")
        ) {
          msg = t("errors.tooManyRequests");
        } else if (e.message) {
          // Use the error message if it's user-friendly
          msg = e.message;
        }
      }

      setSubmitError(msg);
      push({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate totals using local cart values
  const subtotal = localSubtotal;
  const deliveryFee = orderType === "DELIVERY" ? checkoutConfig.deliveryFee : 0;
  const codFee =
    orderType === "DELIVERY" && paymentMethod === PaymentMethod.CASH
      ? checkoutConfig.codFee
      : 0;
  const totalAmount = subtotal + deliveryFee + codFee;
  const itemCount = localItemCount;
  const stepCartDone = cartItems.length > 0;
  const stepDetailsDone =
    orderType === "DELIVERY"
      ? Boolean(selectedAddress)
      : needsAddressForPayment
        ? Boolean(selectedAddress)
        : true;
  const stepPaymentReady = isOnlinePayment
    ? hasAuthForOnlinePayment && hasPhoneForOnlinePayment && stepDetailsDone
    : true;

  const getCartItemImageSources = (item: LocalCartItem): string[] => {
    return [...getLocalProductImageCandidates(item.name), item.image].filter(
      Boolean,
    ) as string[];
  };

  const formatCartItemOptions = (item: LocalCartItem): string | null => {
    const attrs = item.attributes || {};
    const entries = Object.entries(attrs).filter(
      ([, values]) => Array.isArray(values) && values.length > 0,
    );
    if (entries.length === 0) return null;

    const parts = entries.map(([k, values]) => {
      const names = values
        .map((v) => v.valueName)
        .filter(Boolean)
        .join(", ");
      return names ? `${k}: ${names}` : k;
    });

    const shown = parts.slice(0, 2);
    const remaining = parts.length - shown.length;
    return remaining > 0
      ? `${shown.join(" • ")} • ${t("more", { count: remaining })}`
      : shown.join(" • ");
  };

  if (loading)
    return (
      <main className="page-transition loaded">
        <div className="min-h-screen bg-elite-cream flex items-center justify-center py-20">
          <LoadingState
            variant="spinner"
            message={t("loadingCart")}
            size="large"
          />
        </div>
        <Footer />
      </main>
    );

  if (error)
    return (
      <main className="page-transition loaded">
        <div className="min-h-screen bg-elite-cream flex items-center justify-center py-20">
          <ErrorState
            error={error}
            onRetry={refreshCart}
            size="large"
            showDetails
          />
        </div>
        <Footer />
      </main>
    );

  return (
    <main className="page-transition loaded overflow-x-hidden">
      <div className="min-h-screen bg-elite-cream w-full overflow-x-hidden">
        {/* Header - Menu page style with big rounded elements */}
        <div className="bg-elite-burgundy text-elite-cream py-8 sm:py-12 md:py-16">
          <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb - Hidden on mobile, reserved space */}
            <div className="hidden sm:flex items-center gap-2 text-sm mb-4 h-6">
              <LocalizedLink
                href="/menu"
                className="hover:text-elite-light-cream transition-colors duration-200 font-cabin"
              >
                {t("breadcrumb.menu")}
              </LocalizedLink>
              <ChevronRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
              <span className="font-semibold font-cabin">
                {t("breadcrumb.current")}
              </span>
            </div>

            {/* Page Header - Big text, fully rounded icon */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-elite-cream/20 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-calistoga text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 sm:mb-3">
                  {t("title")}
                </h1>
                <p className="font-cabin text-elite-cream/90 text-base sm:text-lg md:text-xl hidden sm:block">
                  {t("subtitle")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Menu page spacing, prevent overflow on mobile */}
        <div className="max-w-[1700px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 md:py-8 lg:py-12 lg:pt-32 overflow-x-hidden">
          {/* Checkout progress */}
          <div className="mb-4 sm:mb-6">
            <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-3 sm:p-4 md:p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow ${
                      stepCartDone
                        ? "bg-emerald-600 text-white"
                        : "bg-elite-cream text-elite-burgundy"
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-calistoga text-elite-black text-sm sm:text-base truncate">
                      {t("steps.cart")}
                    </div>
                    <div className="font-cabin text-elite-black/60 text-xs truncate">
                      {t("cart.items", { count: itemCount })}
                    </div>
                  </div>
                </div>

                <div className="flex-1 h-1 bg-elite-burgundy/10 rounded-full mx-2 sm:mx-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      stepDetailsDone
                        ? "w-2/3 bg-elite-burgundy"
                        : "w-1/3 bg-elite-burgundy"
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow ${
                      stepDetailsDone
                        ? "bg-emerald-600 text-white"
                        : "bg-elite-cream text-elite-burgundy"
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 hidden sm:block">
                    <div className="font-calistoga text-elite-black text-sm sm:text-base truncate">
                      {t("steps.details")}
                    </div>
                    <div className="font-cabin text-elite-black/60 text-xs truncate">
                      {orderTypeLabel(orderType)}
                    </div>
                  </div>
                </div>

                <div className="flex-1 h-1 bg-elite-burgundy/10 rounded-full mx-2 sm:mx-4 overflow-hidden hidden sm:block">
                  <div
                    className={`h-full rounded-full transition-all ${
                      stepPaymentReady
                        ? "w-full bg-elite-burgundy"
                        : "w-1/2 bg-elite-burgundy"
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow ${
                      stepPaymentReady
                        ? "bg-emerald-600 text-white"
                        : "bg-elite-cream text-elite-burgundy"
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 hidden sm:block">
                    <div className="font-calistoga text-elite-black text-sm sm:text-base truncate">
                      {t("steps.payment")}
                    </div>
                    <div className="font-cabin text-elite-black/60 text-xs truncate">
                      {paymentMethodLabel(paymentMethod)}
                    </div>
                  </div>
                </div>
              </div>

              {isOnlinePayment &&
                (!hasAuthForOnlinePayment || !hasPhoneForOnlinePayment) && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                    <p className="font-cabin text-amber-900 text-sm">
                      {t("warnings.onlinePaymentRequirements")}
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* Pending payment callout (order created but payment not started) */}
          {pendingPaymentOrder && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 space-y-3 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h3 className="font-calistoga text-amber-900 text-xl">
                    {t("pendingPayment.title")}
                  </h3>
                  <p className="font-cabin text-amber-800">
                    {t("pendingPayment.description")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="flex-1 px-6 py-3 bg-elite-burgundy text-elite-cream rounded-full font-cabin font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                  onClick={() => retryPaymentForOrder(pendingPaymentOrder.id)}
                  disabled={submitting}
                >
                  {t("pendingPayment.continue")}
                </button>
                <LocalizedLink
                  href={`/orders/${pendingPaymentOrder.id}`}
                  className="flex-1 px-6 py-3 border-2 border-elite-burgundy text-elite-burgundy rounded-full font-cabin font-semibold hover:bg-elite-burgundy/5 transition-all text-center"
                >
                  {t("pendingPayment.viewOrder")}
                </LocalizedLink>
              </div>
            </div>
          )}

          {/* Success Message */}
          {lastOrder && (
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Check className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-calistoga text-emerald-800 text-2xl">
                    {t("success.title")}
                  </h3>
                  <p className="font-cabin text-emerald-700">
                    {t("success.orderNumber")}{" "}
                    {lastOrder.orderNumber?.slice(0, 8) ||
                      lastOrder.id?.slice(0, 8)}
                  </p>
                </div>
              </div>

              <div className="bg-white/60 rounded-xl p-4 space-y-2">
                <div className="flex justify-between font-cabin text-emerald-800">
                  <span>{t("success.totalPaid")}</span>
                  <span className="font-semibold">
                    {formatCurrency(lastOrder.total || 0)}
                  </span>
                </div>
                <div className="flex justify-between font-cabin text-emerald-700 text-sm">
                  <span>{t("success.paymentMethod")}</span>
                  <span>
                    {paymentMethodLabel(
                      lastOrder.paymentMethod as PaymentMethod,
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-cabin text-emerald-700 text-sm">
                  <span>{t("success.orderType")}</span>
                  <span>
                    {orderTypeLabel(lastOrder.orderType as OrderType)}
                  </span>
                </div>
              </div>

              {lastOrder.integrations?.odoo?.saleOrderId && (
                <div className="font-cabin text-sm text-emerald-700 flex items-center gap-2 bg-white/40 rounded-lg p-3">
                  <Receipt className="w-4 h-4" />
                  <span>
                    {t("success.syncedToOdoo")}{" "}
                    {lastOrder.integrations.odoo.saleOrderId}
                  </span>
                  {lastOrder.integrations.odoo.url && (
                    <a
                      className="text-emerald-600 underline hover:text-emerald-800 ml-auto flex items-center gap-1"
                      href={lastOrder.integrations.odoo.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("success.viewInOdoo")}{" "}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
              {lastOrder.integrations?.odoo?.posOrderId && (
                <div className="font-cabin text-sm text-emerald-700 flex items-center gap-2 bg-white/40 rounded-lg p-3">
                  <Store className="w-4 h-4" />
                  <span>
                    {t("success.posOrder", {
                      id: lastOrder.integrations.odoo.posOrderId,
                    })}
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <LocalizedLink
                  href={`/orders/${lastOrder.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full font-cabin font-semibold hover:bg-emerald-700 transition-all"
                >
                  <Receipt className="w-4 h-4" />
                  {t("success.viewOrderDetails")}
                </LocalizedLink>
                <LocalizedLink
                  href="/orders"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-emerald-600 text-emerald-700 rounded-full font-cabin font-semibold hover:bg-emerald-50 transition-all"
                >
                  {t("success.allOrders")}
                </LocalizedLink>
                <LocalizedLink
                  href="/menu"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-emerald-300 text-emerald-600 rounded-full font-cabin font-medium hover:bg-emerald-50 transition-all"
                >
                  {t("success.continueShopping")}
                </LocalizedLink>
              </div>
            </div>
          )}

          {/* Empty Cart */}
          {!cart || cart.items.length === 0 ? (
            <EmptyState
              variant="no-products"
              title={t("emptyCart.title")}
              description={t("emptyCart.description")}
              actionLabel={t("emptyCart.action")}
              actionHref="/menu"
            />
          ) : (
            <div className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-8 xl:gap-10 lg:grid-cols-12">
              <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 xl:space-y-8 lg:col-span-7 min-w-0">
                {/* Cart Items - Menu page style: fully rounded, big text, prevent overflow */}
                <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 overflow-hidden">
                  <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6 border-b border-elite-burgundy/10 bg-elite-cream/20">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <h2 className="font-calistoga text-elite-burgundy text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
                        <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 flex-shrink-0" />
                        <span className="tabular-nums truncate">
                          {t("cart.title", { count: itemCount })}
                        </span>
                      </h2>
                      {/* Reserved space for loading indicator to prevent layout shift */}
                      <div className="h-5 sm:h-6 flex items-center flex-shrink-0">
                        <span
                          className={`flex items-center justify-end gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm font-cabin text-elite-burgundy/70 min-w-[70px] sm:min-w-[90px] md:min-w-[110px] transition-opacity ${
                            isUpdating ? "opacity-100" : "opacity-0"
                          }`}
                          aria-hidden={!isUpdating}
                        >
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-elite-burgundy/30 border-t-elite-burgundy rounded-full animate-spin" />
                          <span className="hidden sm:inline">
                            {t("cart.updating")}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Horizontal scroll container with snap - Native mobile feel */}
                  <div
                    className="overflow-x-auto scrollbar-hide snap-x snap-mandatory overscroll-x-contain"
                    style={{
                      WebkitOverflowScrolling: "touch",
                      scrollPaddingLeft: "1rem",
                      scrollPaddingRight: "1rem",
                    }}
                  >
                    <ul className="flex flex-row gap-3 sm:gap-4 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 md:grid md:grid-cols-1 md:gap-0 md:px-0 md:py-0">
                      {cartItems.map((item, index) => (
                        <li
                          key={item.id}
                          className="snap-start snap-always flex-shrink-0 w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-2rem)] md:w-full md:flex-shrink md:snap-none bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 flex flex-row items-center gap-3 sm:gap-4 p-3 sm:p-4 transition-all duration-300 hover:shadow-2xl hover:border-elite-burgundy/20 max-w-full overflow-hidden md:p-5 lg:p-6"
                        >
                          {/* Item Image */}
                          <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-b from-elite-burgundy/8 to-elite-burgundy/15 shadow-lg relative">
                            <ImageWithFallback
                              src={getCartItemImageSources(item)}
                              alt={item.name}
                              fill
                              objectFit="cover"
                              showErrorIcon={true}
                              className="rounded-2xl"
                            />
                          </div>
                          {/* Item Info */}
                          <div className="flex-1 min-w-0 text-left">
                            <h3 className="font-calistoga text-elite-black text-base sm:text-lg font-bold mb-1 line-clamp-2 break-words">
                              {item.name}
                            </h3>
                            <p className="font-cabin text-elite-burgundy text-sm sm:text-base font-bold mb-2">
                              {formatCurrency(item.basePrice)}
                            </p>
                            {item.attributes &&
                              Object.keys(item.attributes).length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-1.5">
                                  {Object.entries(item.attributes).flatMap(
                                    ([attrName, values]) =>
                                      (values || []).map((v) => (
                                        <span
                                          key={`${attrName}:${v.valueId}`}
                                          className="text-[11px] sm:text-xs font-cabin px-2 py-1 rounded-full bg-elite-cream/60 border border-elite-burgundy/10 text-elite-black/70"
                                        >
                                          {attrName}: {v.valueName}
                                        </span>
                                      )),
                                  )}
                                </div>
                              )}
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <button
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-elite-burgundy/20 flex items-center justify-center text-elite-burgundy bg-white hover:bg-elite-burgundy hover:text-elite-cream active:scale-95 transition-all disabled:opacity-50"
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    Math.max(1, item.quantity - 1),
                                  )
                                }
                                disabled={isUpdating}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                className="w-12 sm:w-14 bg-transparent text-center font-calistoga text-elite-black text-lg sm:text-xl font-bold tabular-nums"
                                value={item.quantity}
                                onChange={(e) => {
                                  const newQuantity = parseInt(
                                    e.target.value,
                                    10,
                                  );
                                  if (newQuantity > 0) {
                                    updateQuantity(item.id, newQuantity);
                                  }
                                }}
                                min="1"
                              />
                              <button
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-elite-burgundy/20 flex items-center justify-center text-elite-burgundy bg-white hover:bg-elite-burgundy hover:text-elite-cream active:scale-95 transition-all disabled:opacity-50"
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                disabled={isUpdating}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {/* Remove Button */}
                          <button
                            className="ml-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50"
                            onClick={() => removeFromCart(item.id)}
                            disabled={isUpdating}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Order Type Selection - Menu page style: fully rounded, big text, prevent overflow */}
                <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-4 sm:p-5 md:p-6 lg:p-7 xl:p-9 overflow-hidden">
                  <h2 className="font-calistoga text-elite-burgundy text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 md:mb-5 flex items-center gap-1.5 sm:gap-2 md:gap-3">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 flex-shrink-0" />
                    <span className="truncate">{t("orderType.title")}</span>
                  </h2>
                  <div className="grid gap-3 sm:gap-4 md:gap-5 sm:grid-cols-2">
                    <label
                      className={`flex items-center gap-3 sm:gap-4 md:gap-5 p-4 sm:p-5 md:p-6 rounded-3xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg active:scale-[0.98] touch-manipulation min-w-0 overflow-hidden min-h-[108px] sm:min-h-[120px] ${
                        orderType === "PICKUP"
                          ? "border-elite-burgundy bg-elite-burgundy/5 shadow-md"
                          : "border-elite-burgundy/20 hover:border-elite-burgundy/40 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        value="PICKUP"
                        checked={orderType === "PICKUP"}
                        onChange={() => setOrderType("PICKUP" as OrderType)}
                        className="sr-only"
                      />
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300 ${
                          orderType === "PICKUP"
                            ? "bg-elite-burgundy text-elite-cream"
                            : "bg-elite-cream text-elite-burgundy"
                        }`}
                      >
                        <Store className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="font-calistoga text-elite-black text-base sm:text-lg md:text-xl font-bold leading-tight line-clamp-2">
                          {t("orderType.pickup")}
                        </div>
                        <div className="font-cabin text-elite-black/60 text-xs sm:text-sm mt-0.5 sm:mt-1">
                          {t("orderType.free")}
                        </div>
                      </div>
                      <Check
                        className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex-shrink-0 transition-opacity duration-300 ${
                          orderType === "PICKUP"
                            ? "text-elite-burgundy opacity-100"
                            : "text-elite-burgundy opacity-0"
                        }`}
                        aria-hidden={orderType !== "PICKUP"}
                      />
                    </label>

                    <label
                      className={`flex items-center gap-3 sm:gap-4 md:gap-5 p-4 sm:p-5 md:p-6 rounded-3xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg active:scale-[0.98] touch-manipulation min-w-0 overflow-hidden min-h-[108px] sm:min-h-[120px] ${
                        orderType === "DELIVERY"
                          ? "border-elite-burgundy bg-elite-burgundy/5 shadow-md"
                          : "border-elite-burgundy/20 hover:border-elite-burgundy/40 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        value="DELIVERY"
                        checked={orderType === "DELIVERY"}
                        onChange={() => setOrderType("DELIVERY" as OrderType)}
                        className="sr-only"
                      />
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300 ${
                          orderType === "DELIVERY"
                            ? "bg-elite-burgundy text-elite-cream"
                            : "bg-elite-cream text-elite-burgundy"
                        }`}
                      >
                        <Truck className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="font-calistoga text-elite-black text-base sm:text-lg md:text-xl font-bold leading-tight line-clamp-2">
                          {t("orderType.delivery")}
                        </div>
                        <div className="font-cabin text-elite-black/60 text-xs sm:text-sm mt-0.5 sm:mt-1">
                          {formatCurrency(checkoutConfig.deliveryFee)}
                        </div>
                      </div>
                      <Check
                        className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex-shrink-0 transition-opacity duration-300 ${
                          orderType === "DELIVERY"
                            ? "text-elite-burgundy opacity-100"
                            : "text-elite-burgundy opacity-0"
                        }`}
                        aria-hidden={orderType !== "DELIVERY"}
                      />
                    </label>
                  </div>
                </div>

                {/* Payment Method - Menu page style: fully rounded, big text, prevent overflow */}
                <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-4 sm:p-5 md:p-6 lg:p-7 xl:p-9 overflow-hidden">
                  <h2 className="font-calistoga text-elite-burgundy text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 md:mb-5 flex items-center gap-1.5 sm:gap-2 md:gap-3">
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 flex-shrink-0" />
                    <span className="truncate">{t("payment.title")}</span>
                  </h2>

                  {!isCheckoutEnabled ? (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-4 flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-calistoga text-amber-900 text-lg">
                          {t("payment.unavailableTitle")}
                        </p>
                        <p className="font-cabin text-amber-800">
                          {t("payment.unavailableDescription")}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className={paymentMethodsGridClass}>
                      {/* Map dynamic checkoutConfig items */}
                      {checkoutConfig.enabledPaymentMethods.map((m) => {
                        const isSelected = paymentMethod === m;
                        const isOnlineMethod =
                          m === PaymentMethod.CARD ||
                          m === PaymentMethod.WALLET;
                        const isTemporarilyDisabled =
                          isOnlineMethod && !checkoutConfig.orderingEnabled;
                        const icon =
                          m === PaymentMethod.WALLET ? (
                            <Wallet className="w-6 h-6 sm:w-7 sm:h-7" />
                          ) : m === PaymentMethod.CASH ? (
                            <Wallet className="w-6 h-6 sm:w-7 sm:h-7" />
                          ) : (
                            <CreditCard className="w-6 h-6 sm:w-7 sm:h-7" />
                          );
                        const label = paymentMethodLabel(m);
                        const desc = isTemporarilyDisabled
                          ? `${paymentMethodDescription(m) || "Cash on Delivery"} (Temporarily Disabled)`
                          : m === PaymentMethod.CASH
                            ? "Cash on Delivery"
                            : paymentMethodDescription(m);

                        return (
                          <label
                            key={m}
                            className={`relative flex items-center gap-3 sm:gap-4 md:gap-5 p-4 sm:p-5 md:p-6 rounded-3xl border-2 transition-all duration-300 min-w-0 overflow-hidden min-h-[108px] sm:min-h-[120px] ${
                              isTemporarilyDisabled
                                ? "cursor-not-allowed opacity-60 bg-gray-50 border-gray-200"
                                : "cursor-pointer hover:shadow-lg active:scale-[0.98] touch-manipulation"
                            } ${
                              isSelected && !isTemporarilyDisabled
                                ? "border-elite-burgundy bg-elite-burgundy/5 shadow-md"
                                : !isTemporarilyDisabled
                                  ? "border-elite-burgundy/20 hover:border-elite-burgundy/40 bg-white"
                                  : ""
                            }`}
                          >
                            <input
                              type="radio"
                              className="sr-only"
                              checked={isSelected}
                              onChange={() => {
                                if (!isTemporarilyDisabled) setPaymentMethod(m);
                              }}
                              disabled={submitting || isTemporarilyDisabled}
                            />
                            <div
                              className={`w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300 ${
                                isSelected && !isTemporarilyDisabled
                                  ? "bg-elite-burgundy text-elite-cream"
                                  : isTemporarilyDisabled
                                    ? "bg-gray-200 text-gray-400"
                                    : "bg-elite-cream text-elite-burgundy"
                              }`}
                            >
                              {icon}
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="font-calistoga text-elite-black text-base sm:text-lg md:text-xl font-bold leading-tight line-clamp-2 tracking-tight">
                                {label}
                              </div>
                              <div className="font-cabin text-xs sm:text-sm mt-0.5 sm:mt-1 line-clamp-2 text-elite-black/60 leading-snug">
                                {desc}
                              </div>
                            </div>
                            <Check
                              className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex-shrink-0 transition-opacity duration-300 ${
                                isSelected && !isTemporarilyDisabled
                                  ? "text-elite-burgundy opacity-100"
                                  : "text-elite-burgundy opacity-0"
                              }`}
                              aria-hidden={!isSelected}
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Delivery Address Selection - Menu page style, reserved space to prevent layout shift, prevent overflow */}
                <div
                  className={`bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-4 sm:p-5 md:p-6 lg:p-7 xl:p-9 transition-all duration-300 min-h-[140px] md:min-h-[230px] overflow-hidden ${
                    orderType === "DELIVERY" || needsAddressForPayment
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none"
                  }`}
                >
                  {(orderType === "DELIVERY" || needsAddressForPayment) && (
                    <>
                      <h2 className="font-calistoga text-elite-burgundy text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 md:mb-5 flex items-center gap-1.5 sm:gap-2 md:gap-3">
                        <MapPin className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 flex-shrink-0" />
                        <span className="truncate">
                          {orderType === "DELIVERY"
                            ? t("address.deliveryTitle")
                            : t("address.billingTitle")}
                        </span>
                      </h2>

                      {/* Reserved space for empty state to prevent layout shift */}
                      <div className="min-h-[60px]">
                        {addresses.length === 0 ? (
                          <div className="bg-elite-cream/50 border-2 border-dashed border-elite-burgundy/30 rounded-3xl p-4 sm:p-5 text-center">
                            <p className="font-cabin text-elite-black/70 text-sm sm:text-base">
                              {t("address.noAddresses")}
                            </p>
                          </div>
                        ) : (
                          <AddressManager
                            onSelectAddress={setSelectedAddress}
                            selectedAddressId={selectedAddress?.id}
                            compact
                            allowAddInSelectMode
                          />
                        )}
                      </div>

                      {addresses.length === 0 && (
                        <div className="mt-4">
                          <AddressManager
                            onSelectAddress={setSelectedAddress}
                            selectedAddressId={selectedAddress?.id}
                            compact
                            allowAddInSelectMode
                          />
                        </div>
                      )}

                      {/* Reserved space for warning message */}
                      <div className="min-h-[50px] mt-4">
                        {!selectedAddress && addresses.length > 0 && (
                          <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-3 sm:p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="font-cabin text-amber-900 text-sm sm:text-base">
                              {t("address.selectAddress")}
                            </p>
                          </div>
                        )}
                        {requiresPhoneForOrder &&
                          selectedAddress &&
                          !hasPhoneForOnlinePayment && (
                            <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-3 sm:p-4 flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                              <p className="font-cabin text-amber-900 text-sm sm:text-base">
                                {t("address.addPhone")}
                              </p>
                            </div>
                          )}
                        {isOnlinePayment && !hasAuthForOnlinePayment && (
                          <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-3 sm:p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="font-cabin text-amber-900 text-sm sm:text-base">
                              {t("address.signInPrefix")}{" "}
                              <LocalizedLink
                                href={`/auth/signin?callbackUrl=${encodeURIComponent(orderCallbackUrl)}`}
                                className="underline font-semibold"
                              >
                                {t("address.signInLink")}
                              </LocalizedLink>{" "}
                              {t("address.signInSuffix")}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Order Summary & Actions - Menu page style: fully rounded, big text, adjusted sticky position */}
              <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:col-span-5 lg:min-w-[360px] xl:min-w-[420px] lg:sticky lg:top-28 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overflow-x-hidden">
                {/* Order Summary - Menu page style, prevent overflow */}
                <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-4 sm:p-5 md:p-6 lg:p-7 xl:p-9 overflow-hidden">
                  <h2 className="font-calistoga text-elite-burgundy text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 md:mb-5 flex items-center gap-1.5 sm:gap-2 md:gap-3">
                    <Receipt className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 flex-shrink-0" />
                    <span className="truncate">{t("summary.title")}</span>
                  </h2>

                  {/* Cart items preview (sidebar) */}
                  <div className="mb-4 sm:mb-5">
                    <div className="space-y-3">
                      {cartItems.map((it) => (
                        <div
                          key={`summary-${it.id}`}
                          className="flex items-center gap-3 rounded-2xl bg-elite-cream/30 border border-elite-burgundy/10 p-4"
                        >
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-elite-burgundy/10 flex-shrink-0">
                            <ImageWithFallback
                              src={getCartItemImageSources(it)}
                              alt={it.name}
                              fill
                              objectFit="cover"
                              showErrorIcon={false}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-cabin font-semibold text-elite-black truncate">
                              {it.name}
                            </div>
                            {formatCartItemOptions(it) && (
                              <div className="font-cabin text-[11px] text-elite-black/60 line-clamp-1">
                                {formatCartItemOptions(it)}
                              </div>
                            )}
                            <div className="font-cabin text-xs text-elite-black/60 flex items-center justify-between gap-2">
                              <span>
                                {t("summary.qty", { count: it.quantity })}
                              </span>
                              <span className="tabular-nums font-semibold text-elite-black/70">
                                {formatCurrency(it.totalPrice)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4 font-cabin text-sm sm:text-base">
                    <div className="flex justify-between text-elite-black/70">
                      <span>{t("summary.subtotal")}</span>
                      <span className="tabular-nums font-semibold">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    {/* Reserved space for delivery fee to prevent layout shift */}
                    <div className="min-h-[24px]">
                      {deliveryFee > 0 && (
                        <div className="flex justify-between text-elite-black/70">
                          <span>{t("summary.delivery")}</span>
                          <span className="tabular-nums font-semibold">
                            {formatCurrency(deliveryFee)}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Reserved space for COD fee to prevent layout shift */}
                    <div className="min-h-[24px]">
                      {codFee > 0 && (
                        <div className="flex justify-between text-elite-black/70">
                          <span>{t("summary.codFee")}</span>
                          <span className="tabular-nums font-semibold">
                            {formatCurrency(codFee)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-[1fr_auto] items-end gap-3 pt-4 sm:pt-5 border-t-2 border-elite-burgundy/20">
                      <span className="font-calistoga text-elite-black text-lg sm:text-xl font-bold leading-tight">
                        {t("summary.total")}
                      </span>
                      <span className="font-calistoga text-elite-burgundy text-2xl sm:text-3xl font-bold tabular-nums text-right whitespace-nowrap leading-none">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions - Menu page style: fully rounded buttons, prevent overflow */}
                <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-4 sm:p-5 md:p-6 lg:p-7 xl:p-9 space-y-3 sm:space-y-4 md:space-y-5 overflow-hidden">
                  {placeOrderBlockReason && (
                    <div className="rounded-2xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-amber-900">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p className="font-cabin text-sm leading-relaxed">
                          {placeOrderBlockReason}
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    className="w-full px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 md:py-5 rounded-full border-2 border-elite-burgundy/20 text-elite-burgundy font-calistoga font-bold text-sm sm:text-base md:text-lg hover:bg-elite-burgundy/5 hover:shadow-lg active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    onClick={clearCart}
                    disabled={isUpdating || submitting}
                  >
                    {t("actions.clearCart")}
                  </button>
                  <button
                    className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 bg-elite-burgundy text-elite-cream rounded-full font-calistoga font-bold text-base sm:text-lg md:text-xl lg:text-2xl shadow-lg transition-all duration-300 hover:opacity-90 hover:shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 touch-manipulation"
                    onClick={placeOrder}
                    disabled={isPlaceOrderDisabled}
                  >
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex-shrink-0" />
                    <span className="text-center leading-tight whitespace-normal">
                      {submitting
                        ? t("actions.placingOrder")
                        : isOnlinePayment
                          ? t("actions.proceedToPayment")
                          : t("actions.placeOrder")}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
      {cartItems.length > 0 && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 p-4 bg-transparent">
          <div className="flex gap-4">
            <button
              className="w-1/3 py-3 rounded-full bg-white/80 backdrop-blur-md text-red-600 font-bold shadow-lg"
              onClick={clearCart}
              disabled={isUpdating || submitting}
            >
              {t("actions.clearCart")}
            </button>
            <button
              className="w-2/3 py-3 rounded-full bg-elite-burgundy text-white font-bold shadow-lg"
              onClick={placeOrder}
              disabled={isPlaceOrderDisabled}
            >
              {submitting
                ? t("actions.placingOrder")
                : isOnlinePayment
                  ? t("actions.proceedToPayment")
                  : t("actions.placeOrder")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function OrderPage() {
  // Next.js requires `useSearchParams()` to be wrapped in a Suspense boundary
  // to avoid prerendering errors in production builds.
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-elite-cream">
          <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-10">
            <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32 rounded-full" />
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                  <Skeleton className="h-40 w-full rounded-3xl" />
                  <Skeleton className="h-40 w-full rounded-3xl" />
                  <Skeleton className="h-40 w-full rounded-3xl" />
                </div>
                <Skeleton className="h-[520px] w-full rounded-3xl" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <OrderPageContent />
    </React.Suspense>
  );
}
