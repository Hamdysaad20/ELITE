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
import { useRouter } from "next/navigation";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
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
  const { push } = useToast();

  const [checkoutConfig, setCheckoutConfig] = React.useState<{
    enabledPaymentMethods: PaymentMethod[];
    deliveryFee: number;
    codFee: number;
  }>({
    enabledPaymentMethods: [PaymentMethod.CASH],
    deliveryFee: 15,
    codFee: 0,
  });

  React.useEffect(() => {
    let cancelled = false;
    async function loadConfig() {
      try {
        const res = await fetch("/api/checkout/config", { credentials: "include" });
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
            deliveryFee: typeof data.deliveryFee === "number" ? data.deliveryFee : 15,
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
    if (!checkoutConfig.enabledPaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(checkoutConfig.enabledPaymentMethods[0] || PaymentMethod.CASH);
    }
  }, [checkoutConfig.enabledPaymentMethods, paymentMethod]);

  // Auto-select default address when switching to delivery
  React.useEffect(() => {
    if (orderType === "DELIVERY" && defaultAddress && !selectedAddress) {
      setSelectedAddress(defaultAddress);
    }
  }, [orderType, defaultAddress, selectedAddress]);

  const placeOrder = async () => {
    setSubmitting(true);
    setSubmitError(null);
    setLastOrder(null);

    // Validate cart has items
    if (!cartItems || cartItems.length === 0) {
      setSubmitError("Your cart is empty");
      setSubmitting(false);
      push({ type: "error", message: "Your cart is empty" });
      return;
    }

    // Validate address for delivery orders
    if (orderType === "DELIVERY" && !selectedAddress) {
      setSubmitError("Please select a delivery address");
      setSubmitting(false);
      push({ type: "error", message: "Please select a delivery address" });
      return;
    }

    try {
      const partnerName =
        session?.user?.name ||
        session?.user?.email?.split("@")[0] ||
        "Website Customer";
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for NextAuth
        body: JSON.stringify({
          paymentMethod,
          orderType,
          addressId: orderType === "DELIVERY" ? selectedAddress?.id : undefined,
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
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to place order");
      }
      const json = await res.json();
      setLastOrder(json.data);
      push({ type: "success", message: "Order placed successfully!" });
      clearCart(); // Clear local cart after successful order
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setSubmitError(msg);
      push({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };


  // Calculate totals using local cart values
  const subtotal = localSubtotal;
  const deliveryFee =
    orderType === "DELIVERY" ? checkoutConfig.deliveryFee : 0;
  const codFee =
    orderType === "DELIVERY" && paymentMethod === PaymentMethod.CASH
      ? checkoutConfig.codFee
      : 0;
  const totalAmount = subtotal + deliveryFee + codFee;
  const itemCount = localItemCount;

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
                    Order #: {lastOrder.orderNumber?.slice(0, 8) || lastOrder.id?.slice(0, 8)}
                  </p>
                </div>
              </div>
              
              <div className="bg-white/60 rounded-xl p-4 space-y-2">
                <div className="flex justify-between font-cabin text-emerald-800">
                  <span>Total Paid</span>
                  <span className="font-semibold">{lastOrder.total?.toFixed(2) || "0.00"} EGP</span>
                </div>
                <div className="flex justify-between font-cabin text-emerald-700 text-sm">
                  <span>Payment Method</span>
                  <span>{lastOrder.paymentMethod === "CASH" ? "Cash on Delivery" : lastOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between font-cabin text-emerald-700 text-sm">
                  <span>Order Type</span>
                  <span>{lastOrder.orderType === "DELIVERY" ? "Delivery" : "Pickup"}</span>
                </div>
              </div>

              {lastOrder.integrations?.odoo?.saleOrderId && (
                <div className="font-cabin text-sm text-emerald-700 flex items-center gap-2 bg-white/40 rounded-lg p-3">
                  <Receipt className="w-4 h-4" />
                  <span>Synced to Odoo: Sale #{lastOrder.integrations.odoo.saleOrderId}</span>
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
                  <span>POS Order #{lastOrder.integrations.odoo.posOrderId}</span>
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
                      <span className="tabular-nums truncate">Cart ({itemCount})</span>
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
                <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch', scrollPaddingLeft: '1rem', scrollPaddingRight: '1rem' }}>
                  <ul className="flex flex-row gap-3 sm:gap-4 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 md:grid md:grid-cols-1 md:gap-0 md:px-0 md:py-0">
                    {cartItems.map((item, index) => (
                      <li
                        key={item.id}
                        className="snap-start snap-always flex-shrink-0 w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-2rem)] md:w-full md:flex-shrink md:snap-none bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 flex flex-row items-center gap-3 sm:gap-4 p-3 sm:p-4 transition-all duration-300 hover:shadow-2xl hover:border-elite-burgundy/20 max-w-full overflow-hidden md:p-5 lg:p-6"
                      >
                        {/* Item Image */}
                        <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-b from-elite-burgundy/8 to-elite-burgundy/15 shadow-lg relative">
                          <ImageWithFallback
                            src={item.image}
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
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <button
                              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-elite-burgundy/20 flex items-center justify-center text-elite-burgundy bg-white hover:bg-elite-burgundy hover:text-elite-cream active:scale-95 transition-all disabled:opacity-50"
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              disabled={isUpdating}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              className="w-12 sm:w-14 bg-transparent text-center font-calistoga text-elite-black text-lg sm:text-xl font-bold tabular-nums"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQuantity = parseInt(e.target.value, 10);
                                if (newQuantity > 0) {
                                  updateQuantity(item.id, newQuantity);
                                }
                              }}
                              min="1"
                            />
                            <button
                              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-elite-burgundy/20 flex items-center justify-center text-elite-burgundy bg-white hover:bg-elite-burgundy hover:text-elite-cream active:scale-95 transition-all disabled:opacity-50"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
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
                        orderType === "PICKUP" ? "text-elite-burgundy opacity-100" : "text-elite-burgundy opacity-0"
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
                        orderType === "DELIVERY" ? "text-elite-burgundy opacity-100" : "text-elite-burgundy opacity-0"
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

                <div className="grid gap-2.5 sm:gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Show all payment methods, mark unavailable ones as coming soon */}
                  {Object.values(PaymentMethod).map((m) => {
                    const isEnabled = checkoutConfig.enabledPaymentMethods.includes(m);
                    const isSelected = paymentMethod === m;
                    const isComingSoon = !isEnabled;
                    
                    const getPaymentIcon = () => {
                      switch (m) {
                        case PaymentMethod.CASH:
                          return <Receipt className="w-6 h-6 sm:w-7 sm:h-7" />;
                        case PaymentMethod.CARD:
                          return <CreditCard className="w-6 h-6 sm:w-7 sm:h-7" />;
                        case PaymentMethod.WALLET:
                          return <Wallet className="w-6 h-6 sm:w-7 sm:h-7" />;
                        case PaymentMethod.FAWRY:
                          return <Smartphone className="w-6 h-6 sm:w-7 sm:h-7" />;
                        default:
                          return <CreditCard className="w-6 h-6 sm:w-7 sm:h-7" />;
                      }
                    };
                    const getPaymentLabel = () => {
                      switch (m) {
                        case PaymentMethod.CASH:
                          return "Cash";
                        case PaymentMethod.CARD:
                          return "Card";
                        case PaymentMethod.WALLET:
                          return "Wallet";
                        case PaymentMethod.FAWRY:
                          return "Fawry";
                        default:
                          return m;
                      }
                    };
                    const getPaymentDescription = () => {
                      if (isComingSoon) {
                        return "Coming soon";
                      }
                      switch (m) {
                        case PaymentMethod.CASH:
                          return orderType === "DELIVERY" && codFee > 0 
                            ? `+${codFee.toFixed(2)} EGP fee`
                            : "On delivery";
                        case PaymentMethod.CARD:
                          return "Credit/Debit";
                        case PaymentMethod.WALLET:
                          return "Mobile wallet";
                        case PaymentMethod.FAWRY:
                          return "Pay with Fawry";
                        default:
                          return "";
                      }
                    };

                    return (
                      <label
                        key={m}
                        className={`relative flex items-center gap-3 sm:gap-4 md:gap-5 p-3 sm:p-4 md:p-5 rounded-3xl border-2 transition-all duration-300 min-w-0 overflow-hidden ${
                          isComingSoon
                            ? "border-elite-burgundy/10 bg-elite-cream/30 opacity-60 cursor-not-allowed"
                            : isSelected
                            ? "border-elite-burgundy bg-elite-burgundy/5 shadow-md cursor-pointer hover:shadow-lg active:scale-[0.98] touch-manipulation"
                            : "border-elite-burgundy/20 hover:border-elite-burgundy/40 bg-white cursor-pointer hover:shadow-lg active:scale-[0.98] touch-manipulation"
                        }`}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          checked={isSelected}
                          onChange={() => !isComingSoon && setPaymentMethod(m)}
                          disabled={submitting || isComingSoon}
                        />
                        <div
                          className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300 ${
                            isComingSoon
                              ? "bg-elite-cream/50 text-elite-burgundy/40"
                              : isSelected
                              ? "bg-elite-burgundy text-elite-cream"
                              : "bg-elite-cream text-elite-burgundy"
                          }`}
                        >
                          {getPaymentIcon()}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="font-calistoga text-elite-black text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate leading-tight tracking-tight">
                            {getPaymentLabel()}
                          </div>
                          <div className={`font-cabin text-xs sm:text-sm md:text-base mt-0.5 sm:mt-1 line-clamp-1 ${
                            isComingSoon ? "text-elite-burgundy/50 italic" : "text-elite-black/60"
                          }`}>
                            {getPaymentDescription()}
                          </div>
                        </div>
                        {isComingSoon && (
                          <span className="absolute top-2 right-2 bg-elite-burgundy/10 text-elite-burgundy text-[9px] sm:text-[10px] font-cabin font-semibold px-1.5 sm:px-2 py-0.5 rounded-full border border-elite-burgundy/20">
                            Soon
                          </span>
                        )}
                        {!isComingSoon && (
                          <Check
                            className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex-shrink-0 transition-opacity duration-300 ${
                              isSelected ? "text-elite-burgundy opacity-100" : "text-elite-burgundy opacity-0"
                            }`}
                            aria-hidden={!isSelected}
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Address Selection - Menu page style, reserved space to prevent layout shift, prevent overflow */}
              <div className={`bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 transition-all duration-300 min-h-[120px] md:min-h-[200px] overflow-hidden ${orderType === "DELIVERY" ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                {orderType === "DELIVERY" && (
                  <>
                    <h2 className="font-calistoga text-elite-burgundy text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 md:mb-5 flex items-center gap-1.5 sm:gap-2 md:gap-3">
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 flex-shrink-0" />
                      <span className="truncate">Delivery Address</span>
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
                            Please select a delivery address
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
                <div className="space-y-3 sm:space-y-4 font-cabin text-base sm:text-lg">
                  <div className="flex justify-between text-elite-black/70">
                    <span>Subtotal</span>
                    <span className="tabular-nums font-semibold">{subtotal.toFixed(2)} EGP</span>
                  </div>
                  {/* Reserved space for delivery fee to prevent layout shift */}
                  <div className="min-h-[24px]">
                    {deliveryFee > 0 && (
                      <div className="flex justify-between text-elite-black/70">
                        <span>Delivery</span>
                        <span className="tabular-nums font-semibold">{deliveryFee.toFixed(2)} EGP</span>
                      </div>
                    )}
                  </div>
                  {/* Reserved space for COD fee to prevent layout shift */}
                  <div className="min-h-[24px]">
                    {codFee > 0 && (
                      <div className="flex justify-between text-elite-black/70">
                        <span>COD Fee</span>
                        <span className="tabular-nums font-semibold">{codFee.toFixed(2)} EGP</span>
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
                    (orderType === "DELIVERY" && !selectedAddress)
                  }
                >
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex-shrink-0" />
                  <span className="truncate">{submitting ? "Placing Order…" : "Place Order"}</span>
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
      <Footer />
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
                    (orderType === "DELIVERY" && !selectedAddress)
                }
            >
                {submitting ? "Placing Order…" : "Place Order"}
            </button>
        </div>
    </div>
    </main>
  );
}

