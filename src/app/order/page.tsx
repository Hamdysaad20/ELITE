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
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function OrderPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
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
    PaymentMethod.CARD,
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

  const [checkoutConfig, setCheckoutConfig] = React.useState<{
    enabledPaymentMethods: PaymentMethod[];
    deliveryFee: number;
    codFee: number;
  }>({
    enabledPaymentMethods: [PaymentMethod.CARD, PaymentMethod.WALLET],
    deliveryFee: 15,
    codFee: 0,
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
    paymentMethod === PaymentMethod.CARD || paymentMethod === PaymentMethod.WALLET;
  const needsAddressForPayment = isOnlinePayment;
  const hasAuthForOnlinePayment = Boolean(session?.user?.email);
  const hasPhoneForOnlinePayment = Boolean(
    selectedAddress?.phone || session?.user?.phone,
  );

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
          const msg =
            json?.error ||
            "Could not initialize payment. Please try again or use cash.";
          throw new Error(msg);
        }

        clearCart();
        window.location.href = `/payment/process?orderId=${orderId}&paymentKey=${json.data.paymentKey}`;
      } catch (e) {
        const msg =
          e instanceof Error && e.message
            ? e.message
            : "Could not initialize payment. Please try again.";
        setSubmitError(msg);
        push({ type: "error", message: msg });
      } finally {
        setSubmitting(false);
      }
    },
    [clearCart, push],
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
      setSubmitError(
        "Online ordering is temporarily unavailable. Please try again later.",
      );
      setSubmitting(false);
      push({
        type: "error",
        message:
          "Online ordering is temporarily unavailable. Please try again later.",
      });
      return;
    }

    // Validate cart has items
    if (!cartItems || cartItems.length === 0) {
      setSubmitError("Your cart is empty. Add items to continue.");
      setSubmitting(false);
      push({
        type: "error",
        message: "Your cart is empty. Add items to continue.",
      });
      return;
    }

    // Online-only checkout: force online payment methods only
    if (paymentMethod !== PaymentMethod.CARD && paymentMethod !== PaymentMethod.WALLET) {
      setSubmitError("Only online payment is available.");
      setSubmitting(false);
      push({ type: "error", message: "Only online payment is available." });
      return;
    }

    // Validate address for delivery orders
    if (orderType === "DELIVERY" && !selectedAddress) {
      setSubmitError("Please select a delivery address.");
      setSubmitting(false);
      push({ type: "error", message: "Please select a delivery address." });
      return;
    }

    // Online payment requires auth + billing details (Paymob requires email, phone, address)
    if (isOnlinePayment && !hasAuthForOnlinePayment) {
      setSubmitError("Please sign in to pay online.");
      setSubmitting(false);
      push({ type: "error", message: "Please sign in to pay online." });
      return;
    }
    if (needsAddressForPayment && !selectedAddress) {
      setSubmitError(
        "Please select an address (required for online payment billing details).",
      );
      setSubmitting(false);
      push({
        type: "error",
        message:
          "Please select an address (required for online payment billing details).",
      });
      return;
    }
    if (isOnlinePayment && !hasPhoneForOnlinePayment) {
      setSubmitError(
        "Please add a valid phone number to your selected address before paying online.",
      );
      setSubmitting(false);
      push({
        type: "error",
        message:
          "Please add a valid phone number to your selected address before paying online.",
      });
      return;
    }

    try {
      const partnerName =
        session?.user?.name ||
        session?.user?.email?.split("@")[0] ||
        "Website Customer";
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
        const errorMessage =
          errorData.error || "Could not place order. Please try again.";
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
        window.location.href = `/payment/process?orderId=${orderData.order.id}&paymentKey=${orderData.paymentIntent.paymentKey}`;
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
      push({ type: "success", message: "Order placed successfully!" });
      clearCart(); // Clear local cart after successful order
    } catch (e) {
      let msg = "Could not place order. Please try again.";

      if (e instanceof Error) {
        if (e.name === "AbortError" || e.message.includes("timeout")) {
          msg = "Request took too long. Please try again.";
        } else if (
          e.message.includes("rate limit") ||
          e.message.includes("Too many")
        ) {
          msg = "Too many requests. Please wait a moment and try again.";
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
    return [
      ...getLocalProductImageCandidates(item.name),
      item.image,
    ].filter(Boolean) as string[];
  };

  const formatCartItemOptions = (item: LocalCartItem): string | null => {
    const attrs = item.attributes || {};
    const entries = Object.entries(attrs).filter(
      ([, values]) => Array.isArray(values) && values.length > 0,
    );
    if (entries.length === 0) return null;

    const parts = entries.map(([k, values]) => {
      const names = values.map((v) => v.valueName).filter(Boolean).join(", ");
      return names ? `${k}: ${names}` : k;
    });

    const shown = parts.slice(0, 2);
    const remaining = parts.length - shown.length;
    return remaining > 0 ? `${shown.join(" • ")} • +${remaining} more` : shown.join(" • ");
  };

  if (loading)
    return (
      <main className="page-transition loaded">
        <div className="min-h-screen bg-elite-cream flex items-center justify-center py-20">
          <LoadingState
            variant="spinner"
            message="Loading your cart..."
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
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* Breadcrumb - Hidden on mobile, reserved space */}
            <div className="hidden sm:flex items-center gap-2 text-sm mb-4 h-6">
              <Link
                href="/menu"
                className="hover:text-elite-light-cream transition-colors duration-200 font-cabin"
              >
                Menu
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="font-semibold font-cabin">Your Order</span>
            </div>

            {/* Page Header - Big text, fully rounded icon */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-elite-cream/20 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-calistoga text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 sm:mb-3">
                  Your Order
                </h1>
                <p className="font-cabin text-elite-cream/90 text-base sm:text-lg md:text-xl hidden sm:block">
                  Review your items and complete checkout
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Menu page spacing, prevent overflow on mobile */}
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12 lg:pt-32 overflow-x-hidden">
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
                      Cart
                    </div>
                    <div className="font-cabin text-elite-black/60 text-xs truncate">
                      {itemCount} items
                    </div>
                  </div>
                </div>

                <div className="flex-1 h-1 bg-elite-burgundy/10 rounded-full mx-2 sm:mx-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      stepDetailsDone ? "w-2/3 bg-elite-burgundy" : "w-1/3 bg-elite-burgundy"
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
                      Details
                    </div>
                    <div className="font-cabin text-elite-black/60 text-xs truncate">
                      {orderType === "DELIVERY" ? "Delivery" : "Pickup"}
                    </div>
                  </div>
                </div>

                <div className="flex-1 h-1 bg-elite-burgundy/10 rounded-full mx-2 sm:mx-4 overflow-hidden hidden sm:block">
                  <div
                    className={`h-full rounded-full transition-all ${
                      stepPaymentReady ? "w-full bg-elite-burgundy" : "w-1/2 bg-elite-burgundy"
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
                      Payment
                    </div>
                    <div className="font-cabin text-elite-black/60 text-xs truncate">
                      {paymentMethod}
                    </div>
                  </div>
                </div>
              </div>

              {isOnlinePayment && (!hasAuthForOnlinePayment || !hasPhoneForOnlinePayment) && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                  <p className="font-cabin text-amber-900 text-sm">
                    Online payment needs sign-in + an address with a valid phone number.
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
                    Payment required
                  </h3>
                  <p className="font-cabin text-amber-800">
                    Your order was created, but payment hasn&apos;t started yet.
                    Please continue to payment to confirm your order.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="flex-1 px-6 py-3 bg-elite-burgundy text-elite-cream rounded-full font-cabin font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                  onClick={() => retryPaymentForOrder(pendingPaymentOrder.id)}
                  disabled={submitting}
                >
                  Continue to Payment
                </button>
                <Link
                  href={`/orders/${pendingPaymentOrder.id}`}
                  className="flex-1 px-6 py-3 border-2 border-elite-burgundy text-elite-burgundy rounded-full font-cabin font-semibold hover:bg-elite-burgundy/5 transition-all text-center"
                >
                  View Order
                </Link>
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
                    Order Placed Successfully!
                  </h3>
                  <p className="font-cabin text-emerald-700">
                    Order #:{" "}
                    {lastOrder.orderNumber?.slice(0, 8) ||
                      lastOrder.id?.slice(0, 8)}
                  </p>
                </div>
              </div>

              <div className="bg-white/60 rounded-xl p-4 space-y-2">
                <div className="flex justify-between font-cabin text-emerald-800">
                  <span>Total Paid</span>
                  <span className="font-semibold">
                    {lastOrder.total?.toFixed(2) || "0.00"} EGP
                  </span>
                </div>
                <div className="flex justify-between font-cabin text-emerald-700 text-sm">
                  <span>Payment Method</span>
                  <span>
                    {lastOrder.paymentMethod === "CASH"
                      ? "Cash on Delivery"
                      : lastOrder.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between font-cabin text-emerald-700 text-sm">
                  <span>Order Type</span>
                  <span>
                    {lastOrder.orderType === "DELIVERY" ? "Delivery" : "Pickup"}
                  </span>
                </div>
              </div>

              {lastOrder.integrations?.odoo?.saleOrderId && (
                <div className="font-cabin text-sm text-emerald-700 flex items-center gap-2 bg-white/40 rounded-lg p-3">
                  <Receipt className="w-4 h-4" />
                  <span>
                    Synced to Odoo: Sale #
                    {lastOrder.integrations.odoo.saleOrderId}
                  </span>
                  {lastOrder.integrations.odoo.url && (
                    <a
                      className="text-emerald-600 underline hover:text-emerald-800 ml-auto flex items-center gap-1"
                      href={lastOrder.integrations.odoo.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View in Odoo <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
              {lastOrder.integrations?.odoo?.posOrderId && (
                <div className="font-cabin text-sm text-emerald-700 flex items-center gap-2 bg-white/40 rounded-lg p-3">
                  <Store className="w-4 h-4" />
                  <span>
                    POS Order #{lastOrder.integrations.odoo.posOrderId}
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href={`/orders/${lastOrder.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full font-cabin font-semibold hover:bg-emerald-700 transition-all"
                >
                  <Receipt className="w-4 h-4" />
                  View Order Details
                </Link>
                <Link
                  href="/orders"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-emerald-600 text-emerald-700 rounded-full font-cabin font-semibold hover:bg-emerald-50 transition-all"
                >
                  All Orders
                </Link>
                <Link
                  href="/menu"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-emerald-300 text-emerald-600 rounded-full font-cabin font-medium hover:bg-emerald-50 transition-all"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}

          {/* Empty Cart */}
          {!cart || cart.items.length === 0 ? (
            <EmptyState
              variant="no-products"
              title="Your cart is empty"
              description="Explore our menu and add some delicious drinks!"
              actionLabel="Browse Menu"
              actionHref="/menu"
            />
          ) : (
            <div className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-8 xl:gap-10 lg:grid-cols-3">
              <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 xl:space-y-8 lg:col-span-2 min-w-0">
                {/* Cart Items - Menu page style: fully rounded, big text, prevent overflow */}
                <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 overflow-hidden">
                  <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6 border-b border-elite-burgundy/10 bg-elite-cream/20">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <h2 className="font-calistoga text-elite-burgundy text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
                        <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 flex-shrink-0" />
                        <span className="tabular-nums truncate">
                          Cart ({itemCount})
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
                          <span className="hidden sm:inline">Updating...</span>
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
                              EGP {item.basePrice.toFixed(2)}
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
                <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 overflow-hidden">
                  <h2 className="font-calistoga text-elite-burgundy text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 md:mb-5 flex items-center gap-1.5 sm:gap-2 md:gap-3">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 flex-shrink-0" />
                    <span className="truncate">Order Type</span>
                  </h2>
                  <div className="grid gap-2.5 sm:gap-3 md:gap-4 sm:grid-cols-2">
                    <label
                      className={`flex items-center gap-3 sm:gap-4 md:gap-5 p-3 sm:p-4 md:p-5 rounded-3xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg active:scale-[0.98] touch-manipulation min-w-0 overflow-hidden ${
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
                        className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300 ${
                          orderType === "PICKUP"
                            ? "bg-elite-burgundy text-elite-cream"
                            : "bg-elite-cream text-elite-burgundy"
                        }`}
                      >
                        <Store className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="font-calistoga text-elite-black text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate">
                          Pickup
                        </div>
                        <div className="font-cabin text-elite-black/60 text-xs sm:text-sm md:text-base mt-0.5 sm:mt-1 truncate">
                          Free
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
                      className={`flex items-center gap-3 sm:gap-4 md:gap-5 p-3 sm:p-4 md:p-5 rounded-3xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg active:scale-[0.98] touch-manipulation min-w-0 overflow-hidden ${
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
                        className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300 ${
                          orderType === "DELIVERY"
                            ? "bg-elite-burgundy text-elite-cream"
                            : "bg-elite-cream text-elite-burgundy"
                        }`}
                      >
                        <Truck className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="font-calistoga text-elite-black text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate">
                          Delivery
                        </div>
                        <div className="font-cabin text-elite-black/60 text-xs sm:text-sm md:text-base mt-0.5 sm:mt-1 truncate">
                          {checkoutConfig.deliveryFee.toFixed(2)} EGP
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
                <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 overflow-hidden">
                  <h2 className="font-calistoga text-elite-burgundy text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 md:mb-5 flex items-center gap-1.5 sm:gap-2 md:gap-3">
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 flex-shrink-0" />
                    <span className="truncate">Payment</span>
                  </h2>

                  {!isCheckoutEnabled ? (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-4 flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-calistoga text-amber-900 text-lg">
                          Online ordering unavailable
                        </p>
                        <p className="font-cabin text-amber-800">
                          Please try again later.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-2.5 sm:gap-3 md:gap-4 sm:grid-cols-2">
                      {/* Online-only payment methods */}
                      {checkoutConfig.enabledPaymentMethods.map((m) => {
                        const isSelected = paymentMethod === m;
                        const icon =
                          m === PaymentMethod.WALLET ? (
                            <Wallet className="w-6 h-6 sm:w-7 sm:h-7" />
                          ) : (
                            <CreditCard className="w-6 h-6 sm:w-7 sm:h-7" />
                          );
                        const label = m === PaymentMethod.WALLET ? "Wallet" : "Card";
                        const desc =
                          m === PaymentMethod.WALLET
                            ? "Mobile wallet"
                            : "Credit/Debit";

                        return (
                          <label
                            key={m}
                            className={`relative flex items-center gap-3 sm:gap-4 md:gap-5 p-3 sm:p-4 md:p-5 rounded-3xl border-2 transition-all duration-300 min-w-0 overflow-hidden cursor-pointer hover:shadow-lg active:scale-[0.98] touch-manipulation ${
                              isSelected
                                ? "border-elite-burgundy bg-elite-burgundy/5 shadow-md"
                                : "border-elite-burgundy/20 hover:border-elite-burgundy/40 bg-white"
                            }`}
                          >
                            <input
                              type="radio"
                              className="sr-only"
                              checked={isSelected}
                              onChange={() => setPaymentMethod(m)}
                              disabled={submitting}
                            />
                            <div
                              className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300 ${
                                isSelected
                                  ? "bg-elite-burgundy text-elite-cream"
                                  : "bg-elite-cream text-elite-burgundy"
                              }`}
                            >
                              {icon}
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="font-calistoga text-elite-black text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate leading-tight tracking-tight">
                                {label}
                              </div>
                              <div className="font-cabin text-xs sm:text-sm md:text-base mt-0.5 sm:mt-1 line-clamp-1 text-elite-black/60">
                                {desc}
                              </div>
                            </div>
                            <Check
                              className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex-shrink-0 transition-opacity duration-300 ${
                                isSelected
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
                  className={`bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 transition-all duration-300 min-h-[120px] md:min-h-[200px] overflow-hidden ${
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
                            ? "Delivery Address"
                            : "Billing Address"}
                        </span>
                      </h2>

                      {/* Reserved space for empty state to prevent layout shift */}
                      <div className="min-h-[60px]">
                        {addresses.length === 0 ? (
                          <div className="bg-elite-cream/50 border-2 border-dashed border-elite-burgundy/30 rounded-3xl p-4 sm:p-5 text-center">
                            <p className="font-cabin text-elite-black/70 text-sm sm:text-base">
                              No addresses saved. Add one to continue.
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
                              Please select an address
                            </p>
                          </div>
                        )}
                        {isOnlinePayment &&
                          selectedAddress &&
                          !hasPhoneForOnlinePayment && (
                            <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-3 sm:p-4 flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                              <p className="font-cabin text-amber-900 text-sm sm:text-base">
                                Add a valid phone number to this address to pay
                                online.
                              </p>
                            </div>
                          )}
                        {isOnlinePayment && !hasAuthForOnlinePayment && (
                          <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-3 sm:p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="font-cabin text-amber-900 text-sm sm:text-base">
                              Please{" "}
                              <Link
                                href="/auth/signin?callbackUrl=%2Forder"
                                className="underline font-semibold"
                              >
                                sign in
                              </Link>{" "}
                              to pay online.
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Order Summary & Actions - Menu page style: fully rounded, big text, adjusted sticky position */}
              <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:col-span-1 lg:sticky lg:top-28 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overflow-x-hidden">
                {/* Order Summary - Menu page style, prevent overflow */}
                <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 overflow-hidden">
                  <h2 className="font-calistoga text-elite-burgundy text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 md:mb-5 flex items-center gap-1.5 sm:gap-2 md:gap-3">
                    <Receipt className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 flex-shrink-0" />
                    <span className="truncate">Summary</span>
                  </h2>

                  {/* Cart items preview (sidebar) */}
                  <div className="mb-4 sm:mb-5">
                    <div className="space-y-3">
                      {cartItems.map((it) => (
                        <div
                          key={`summary-${it.id}`}
                          className="flex items-center gap-3 rounded-2xl bg-elite-cream/30 border border-elite-burgundy/10 p-3"
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
                              <span>Qty: {it.quantity}</span>
                              <span className="tabular-nums font-semibold text-elite-black/70">
                                {it.totalPrice.toFixed(2)} EGP
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4 font-cabin text-base sm:text-lg">
                    <div className="flex justify-between text-elite-black/70">
                      <span>Subtotal</span>
                      <span className="tabular-nums font-semibold">
                        {subtotal.toFixed(2)} EGP
                      </span>
                    </div>
                    {/* Reserved space for delivery fee to prevent layout shift */}
                    <div className="min-h-[24px]">
                      {deliveryFee > 0 && (
                        <div className="flex justify-between text-elite-black/70">
                          <span>Delivery</span>
                          <span className="tabular-nums font-semibold">
                            {deliveryFee.toFixed(2)} EGP
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Reserved space for COD fee to prevent layout shift */}
                    <div className="min-h-[24px]">
                      {codFee > 0 && (
                        <div className="flex justify-between text-elite-black/70">
                          <span>COD Fee</span>
                          <span className="tabular-nums font-semibold">
                            {codFee.toFixed(2)} EGP
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between pt-4 sm:pt-5 border-t-2 border-elite-burgundy/20">
                      <span className="font-calistoga text-elite-black text-xl sm:text-2xl font-bold">
                        Total
                      </span>
                      <span className="font-calistoga text-elite-burgundy text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums">
                        {totalAmount.toFixed(2)} EGP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions - Menu page style: fully rounded buttons, prevent overflow */}
                <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 space-y-2.5 sm:space-y-3 md:space-y-4 overflow-hidden">
                  <button
                    className="w-full px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 md:py-5 rounded-full border-2 border-elite-burgundy/20 text-elite-burgundy font-calistoga font-bold text-sm sm:text-base md:text-lg hover:bg-elite-burgundy/5 hover:shadow-lg active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    onClick={clearCart}
                    disabled={isUpdating || submitting}
                  >
                    Clear Cart
                  </button>
                  <button
                    className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 bg-elite-burgundy text-elite-cream rounded-full font-calistoga font-bold text-base sm:text-lg md:text-xl lg:text-2xl shadow-lg transition-all duration-300 hover:opacity-90 hover:shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 touch-manipulation"
                    onClick={placeOrder}
                    disabled={
                      submitting ||
                      isUpdating ||
                      (orderType === "DELIVERY" && !selectedAddress) ||
                      (needsAddressForPayment && !selectedAddress) ||
                      (isOnlinePayment && !hasAuthForOnlinePayment) ||
                      (isOnlinePayment && !hasPhoneForOnlinePayment)
                    }
                  >
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex-shrink-0" />
                    <span className="truncate">
                      {submitting
                        ? "Placing Order…"
                        : isOnlinePayment
                          ? "Proceed to Payment"
                          : "Place Order"}
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
              Clear Cart
            </button>
            <button
              className="w-2/3 py-3 rounded-full bg-elite-burgundy text-white font-bold shadow-lg"
              onClick={placeOrder}
              disabled={
                submitting ||
                isUpdating ||
                (orderType === "DELIVERY" && !selectedAddress) ||
                (needsAddressForPayment && !selectedAddress) ||
                (isOnlinePayment && !hasAuthForOnlinePayment) ||
                (isOnlinePayment && !hasPhoneForOnlinePayment)
              }
            >
              {submitting
                ? "Placing Order…"
                : isOnlinePayment
                  ? "Proceed to Payment"
                  : "Place Order"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
