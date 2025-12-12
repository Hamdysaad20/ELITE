"use client";
import React from "react";
import type { Order, OrderType, Address } from "@/types";
import { OrderIntegrationOptions } from "@/components/OrderIntegrationOptions";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/Skeleton";
import { useCart } from "@/hooks/useCart";
import { useAddresses } from "@/hooks/useAddresses";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileNavigation from "@/components/MobileNavigation";
import AddressManager from "@/components/AddressManager";
import Link from "next/link";
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
} from "lucide-react";

export default function OrderPage() {
  const {
    cart,
    loading,
    error,
    isUpdating,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart,
    total,
  } = useCart();

  const { addresses, defaultAddress } = useAddresses();

  const [orderType, setOrderType] = React.useState<OrderType>(
    "PICKUP" as OrderType,
  );
  const [selectedAddress, setSelectedAddress] = React.useState<Address | null>(
    null,
  );
  const [notes, setNotes] = React.useState("");
  const [saleEnabled, setSaleEnabled] = React.useState(true);
  const [autoConfirm, setAutoConfirm] = React.useState(false);
  const [posEnabled, setPosEnabled] = React.useState(false);
  const [posConfigName, setPosConfigName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [lastOrder, setLastOrder] = React.useState<Order | null>(null);
  interface PosConfig {
    id: number;
    name: string;
    openSessionId?: number | null;
  }
  interface PosDiagnostics {
    configured: boolean;
    hasPos: boolean;
    configs: PosConfig[];
    error?: string;
  }
  const [posDiagnostics, setPosDiagnostics] =
    React.useState<PosDiagnostics | null>(null);
  const { push } = useToast();

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

    // Validate address for delivery orders
    if (orderType === "DELIVERY" && !selectedAddress) {
      setSubmitError("Please select a delivery address");
      setSubmitting(false);
      push({ type: "error", message: "Please select a delivery address" });
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for NextAuth
        body: JSON.stringify({
          paymentMethod: "ONLINE",
          orderType,
          addressId: orderType === "DELIVERY" ? selectedAddress?.id : undefined,
          notes,
          odoo: {
            partner: { name: "Website Customer" },
            sale: { enable: saleEnabled, autoConfirm },
            pos: {
              enable: posEnabled,
              posConfigName: posConfigName || undefined,
            },
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to place order");
      const json = await res.json();
      setLastOrder(json.data);
      push({ type: "success", message: "Order placed successfully" });
      await refreshCart();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setSubmitError(msg);
      push({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    let cancelled = false;
    async function fetchPos() {
      if (!posEnabled) {
        setPosDiagnostics(null);
        return;
      }
      try {
        const res = await fetch("/api/odoo/pos");
        if (!res.ok) throw new Error("Failed POS diagnostics");
        const json = await res.json();
        if (!cancelled) setPosDiagnostics(json.data as PosDiagnostics);
      } catch (err) {
        if (!cancelled)
          setPosDiagnostics({
            error: (err as Error).message,
            configured: false,
            hasPos: false,
            configs: [],
          });
      }
    }
    fetchPos();
    return () => {
      cancelled = true;
    };
  }, [posEnabled]);

  // Calculate totals
  const subtotal = cart?.items.reduce((s, i) => s + i.price, 0) ?? 0;
  const deliveryFee = orderType === "DELIVERY" ? 15 : 0;
  const totalAmount = subtotal + deliveryFee;
  const itemCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

  if (loading)
    return (
      <main className="page-transition loaded">
        <Navigation />
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
        <Navigation />
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
    <main className="page-transition loaded">
      <Navigation />
      <div className="min-h-screen bg-elite-cream">
        {/* Header */}
        <div className="bg-elite-burgundy text-elite-cream py-12">
          <div className="max-w-4xl mx-auto px-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm mb-4">
              <Link
                href="/menu"
                className="hover:text-elite-light-cream transition-colors duration-200"
              >
                Menu
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="font-semibold">Your Order</span>
            </div>

            {/* Page Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-elite-cream/20 rounded-2xl flex items-center justify-center">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h1 className="font-calistoga text-4xl md:text-5xl mb-2">
                  Your Order
                </h1>
                <p className="font-cabin text-elite-cream/90 text-lg">
                  Review your items and complete checkout
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
          {/* Success Message */}
          {lastOrder && (
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-calistoga text-emerald-800 text-xl">
                    Order Placed Successfully!
                  </h3>
                  <p className="font-cabin text-emerald-700">
                    Order #: {lastOrder.orderNumber}
                  </p>
                </div>
              </div>
              {lastOrder.integrations?.odoo?.saleOrderId && (
                <div className="font-cabin text-sm text-emerald-700 flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Odoo Sale ID: {lastOrder.integrations.odoo.saleOrderId}
                  {lastOrder.integrations.odoo.url && (
                    <a
                      className="text-emerald-600 underline hover:text-emerald-800 ml-2"
                      href={lastOrder.integrations.odoo.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open in Odoo →
                    </a>
                  )}
                </div>
              )}
              {lastOrder.integrations?.odoo?.posOrderId && (
                <div className="font-cabin text-sm text-emerald-700 flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Odoo POS ID: {lastOrder.integrations.odoo.posOrderId}
                </div>
              )}
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
            <div className="space-y-6">
              {/* Cart Items */}
              <div className="bg-white rounded-3xl shadow-xl border border-elite-burgundy/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-elite-burgundy/10 bg-elite-cream/30">
                  <div className="flex items-center justify-between">
                    <h2 className="font-calistoga text-elite-burgundy text-xl flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5" />
                      Cart Items ({itemCount})
                    </h2>
                    {isUpdating && (
                      <span className="flex items-center gap-2 text-sm font-cabin text-elite-burgundy/70">
                        <div className="w-4 h-4 border-2 border-elite-burgundy/30 border-t-elite-burgundy rounded-full animate-spin" />
                        Updating...
                      </span>
                    )}
                  </div>
                </div>
                <ul className="divide-y divide-elite-burgundy/10">
                  {cart.items.map((item) => (
                    <li key={item.id} className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Item Info */}
                        <div className="flex-1">
                          <h3 className="font-calistoga text-elite-black text-lg">
                            {item.menuItem?.name || item.menuItemId}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="inline-flex items-center px-3 py-1 bg-elite-burgundy/10 text-elite-burgundy rounded-full text-xs font-cabin font-medium">
                              {item.size}
                            </span>
                            {item.flavor && (
                              <span className="inline-flex items-center px-3 py-1 bg-elite-burgundy/10 text-elite-burgundy rounded-full text-xs font-cabin font-medium">
                                {item.flavor}
                              </span>
                            )}
                            {item.toppings?.map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center px-3 py-1 bg-elite-cream text-elite-black/70 rounded-full text-xs font-cabin"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                          <button
                            className="w-10 h-10 rounded-full border-2 border-elite-burgundy/20 flex items-center justify-center text-elite-burgundy hover:bg-elite-burgundy hover:text-elite-cream transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.max(1, item.quantity - 1),
                              )
                            }
                            disabled={isUpdating}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-calistoga text-elite-black text-lg w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            className="w-10 h-10 rounded-full border-2 border-elite-burgundy/20 flex items-center justify-center text-elite-burgundy hover:bg-elite-burgundy hover:text-elite-cream transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={isUpdating}
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Price & Remove */}
                        <div className="flex items-center gap-4 md:ml-4">
                          <span className="font-calistoga text-elite-burgundy text-xl">
                            {item.price.toFixed(2)} EGP
                          </span>
                          <button
                            className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => removeFromCart(item.id)}
                            disabled={isUpdating}
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Order Type Selection */}
              <div className="bg-white rounded-3xl shadow-xl border border-elite-burgundy/10 p-6">
                <h2 className="font-calistoga text-elite-burgundy text-xl mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Order Type
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      orderType === "PICKUP"
                        ? "border-elite-burgundy bg-elite-burgundy/5"
                        : "border-elite-burgundy/20 hover:border-elite-burgundy/40"
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
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        orderType === "PICKUP"
                          ? "bg-elite-burgundy text-elite-cream"
                          : "bg-elite-cream text-elite-burgundy"
                      }`}
                    >
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-calistoga text-elite-black text-lg">
                        Pickup
                      </div>
                      <div className="font-cabin text-elite-black/60 text-sm">
                        Pick up at our store • Free
                      </div>
                    </div>
                    {orderType === "PICKUP" && (
                      <Check className="w-6 h-6 text-elite-burgundy ml-auto" />
                    )}
                  </label>

                  <label
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      orderType === "DELIVERY"
                        ? "border-elite-burgundy bg-elite-burgundy/5"
                        : "border-elite-burgundy/20 hover:border-elite-burgundy/40"
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
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        orderType === "DELIVERY"
                          ? "bg-elite-burgundy text-elite-cream"
                          : "bg-elite-cream text-elite-burgundy"
                      }`}
                    >
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-calistoga text-elite-black text-lg">
                        Delivery
                      </div>
                      <div className="font-cabin text-elite-black/60 text-sm">
                        Delivered to your door • 15 EGP
                      </div>
                    </div>
                    {orderType === "DELIVERY" && (
                      <Check className="w-6 h-6 text-elite-burgundy ml-auto" />
                    )}
                  </label>
                </div>
              </div>

              {/* Delivery Address Selection - Only show for delivery */}
              {orderType === "DELIVERY" && (
                <div className="bg-white rounded-3xl shadow-xl border border-elite-burgundy/10 p-6">
                  <h2 className="font-calistoga text-elite-burgundy text-xl mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Delivery Address
                  </h2>
                  
                  {addresses.length === 0 ? (
                    <div className="bg-elite-cream/50 border-2 border-dashed border-elite-burgundy/30 rounded-2xl p-6 text-center">
                      <AlertCircle className="w-12 h-12 text-elite-burgundy/60 mx-auto mb-3" />
                      <p className="font-cabin text-elite-black/80 mb-4">
                        No delivery addresses saved yet. Add one to continue with delivery.
                      </p>
                    </div>
                  ) : (
                    <AddressManager
                      onSelectAddress={setSelectedAddress}
                      selectedAddressId={selectedAddress?.id}
                      compact
                    />
                  )}
                  
                  {!selectedAddress && addresses.length > 0 && (
                    <div className="mt-4 bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="font-cabin text-amber-900 text-sm">
                        Please select a delivery address to continue
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Odoo Integration Options */}
              <OrderIntegrationOptions
                saleEnabled={saleEnabled}
                autoConfirm={autoConfirm}
                posEnabled={posEnabled}
                posConfigName={posConfigName}
                notes={notes}
                submitting={submitting}
                submitError={submitError}
                onChange={(c) => {
                  if (c.saleEnabled !== undefined)
                    setSaleEnabled(c.saleEnabled);
                  if (c.autoConfirm !== undefined)
                    setAutoConfirm(c.autoConfirm);
                  if (c.posEnabled !== undefined) setPosEnabled(c.posEnabled);
                  if (c.posConfigName !== undefined)
                    setPosConfigName(c.posConfigName);
                  if (c.notes !== undefined) setNotes(c.notes);
                }}
              />

              {/* POS Diagnostics */}
              {posEnabled && (
                <div className="bg-white rounded-2xl border border-elite-burgundy/10 p-6 space-y-3">
                  <h3 className="font-calistoga text-elite-burgundy text-lg">
                    POS Diagnostics
                  </h3>
                  {!posDiagnostics && (
                    <p className="font-cabin text-elite-black/60">
                      Loading POS data…
                    </p>
                  )}
                  {posDiagnostics?.error && (
                    <p className="font-cabin text-red-600">
                      {posDiagnostics.error}
                    </p>
                  )}
                  {posDiagnostics && !posDiagnostics.error && (
                    <div className="space-y-2 font-cabin text-sm">
                      <div className="flex justify-between">
                        <span className="text-elite-black/70">Configured</span>
                        <span
                          className={
                            posDiagnostics.configured
                              ? "text-emerald-600"
                              : "text-gray-500"
                          }
                        >
                          {String(posDiagnostics.configured)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-elite-black/70">
                          Has POS Module
                        </span>
                        <span
                          className={
                            posDiagnostics.hasPos
                              ? "text-emerald-600"
                              : "text-gray-500"
                          }
                        >
                          {String(posDiagnostics.hasPos)}
                        </span>
                      </div>
                      {posDiagnostics.configs?.map((c) => (
                        <div
                          key={c.id}
                          className="flex justify-between py-2 border-t border-elite-burgundy/10"
                        >
                          <span className="text-elite-black">{c.name}</span>
                          <span
                            className={
                              c.openSessionId
                                ? "text-emerald-600"
                                : "text-gray-500"
                            }
                          >
                            {c.openSessionId
                              ? `Session ${c.openSessionId}`
                              : "No open session"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-white rounded-3xl shadow-xl border border-elite-burgundy/10 p-6">
                <h2 className="font-calistoga text-elite-burgundy text-xl mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Order Summary
                </h2>
                <div className="space-y-3 font-cabin">
                  <div className="flex justify-between text-elite-black/70">
                    <span>Subtotal</span>
                    <span>{subtotal.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between text-elite-black/70">
                    <span>Delivery Fee</span>
                    <span>{deliveryFee.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-elite-burgundy/20">
                    <span className="font-calistoga text-elite-black text-xl">
                      Total
                    </span>
                    <span className="font-calistoga text-elite-burgundy text-2xl">
                      {totalAmount.toFixed(2)} EGP
                    </span>
                  </div>
                  <div className="flex justify-between text-elite-black/50 text-sm">
                    <span>Items</span>
                    <span>{itemCount}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  className="w-full sm:w-auto px-6 py-3 rounded-full border-2 border-elite-burgundy/20 text-elite-burgundy font-cabin font-medium hover:bg-elite-burgundy/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={clearCart}
                  disabled={isUpdating || submitting}
                >
                  Clear Cart
                </button>
                <div className="w-full sm:w-auto flex flex-col items-end gap-2">
                  <div className="font-cabin text-elite-black/70">
                    Total:{" "}
                    <span className="font-calistoga text-elite-burgundy text-xl">
                      {totalAmount.toFixed(2)} EGP
                    </span>
                  </div>
                  <button
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-elite-burgundy text-elite-cream rounded-full font-calistoga text-lg tracking-wide shadow-lg transition-all duration-300 hover:bg-elite-dark-burgundy hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    onClick={placeOrder}
                    disabled={submitting || isUpdating}
                  >
                    <CreditCard className="w-5 h-5" />
                    {submitting ? "Placing Order…" : "Place Order"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
      <MobileNavigation />
    </main>
  );
}
