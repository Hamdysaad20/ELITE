"use client";

import { X, ShoppingCart, Trash2, ArrowRight, Minus, Plus } from "lucide-react";
import { useLocalCart } from "@/hooks/useLocalCart";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, subtotal, tax, total, itemCount } = useLocalCart();
  const router = useRouter();
  const { status } = useSession();

  const handleCheckout = () => {
    if (status === 'unauthenticated') {
      // Redirect to login with callback to checkout
      router.push('/auth/signin?callbackUrl=/checkout');
    } else {
      // Proceed to checkout
      router.push('/checkout');
    }
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-[480px] md:w-[540px] lg:w-[600px] xl:w-[640px] max-w-[calc(100vw-2rem)] bg-elite-cream shadow-2xl z-[70] transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-elite-burgundy text-elite-cream p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <div className="bg-elite-cream/10 p-2 sm:p-2.5 lg:p-3 rounded-2xl">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                </div>
                <div>
                  <h2 className="font-calistoga text-xl sm:text-2xl lg:text-3xl leading-tight">
                    Shopping Cart
                  </h2>
                  {itemCount > 0 && (
                    <p className="font-cabin text-elite-cream/80 text-sm sm:text-base mt-0.5">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 sm:p-2.5 lg:p-3 hover:bg-elite-cream/20 rounded-2xl transition-all active:scale-90 touch-manipulation group"
                aria-label="Close cart"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="bg-elite-burgundy/5 p-8 lg:p-10 rounded-full mb-6 lg:mb-8">
                  <ShoppingCart className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 text-elite-burgundy/30" />
                </div>
                <h3 className="font-calistoga text-elite-burgundy text-lg sm:text-xl lg:text-2xl mb-2 lg:mb-3">
                  Your cart is empty
                </h3>
                <p className="font-cabin text-elite-black/60 text-sm sm:text-base lg:text-lg mb-6 lg:mb-8 max-w-sm">
                  Start adding some delicious items to your order!
                </p>
                <button
                  onClick={onClose}
                  className="bg-gradient-to-r from-elite-burgundy to-elite-dark-burgundy text-elite-cream px-8 sm:px-10 lg:px-12 py-3 sm:py-4 lg:py-5 rounded-2xl font-cabin font-bold text-base lg:text-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg touch-manipulation min-h-[48px] lg:min-h-[56px]"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-3 sm:p-4 lg:p-5 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-elite-burgundy/10"
                  >
                    <div className="flex gap-3 sm:gap-4 lg:gap-5">
                      {/* Image */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden bg-elite-cream flex-shrink-0 ring-2 ring-elite-burgundy/5">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-elite-burgundy/5 to-elite-burgundy/10 flex items-center justify-center">
                            <ShoppingCart className="w-8 h-8 lg:w-10 lg:h-10 text-elite-burgundy/20" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-calistoga text-elite-burgundy text-base sm:text-lg lg:text-xl mb-1 truncate pr-2">
                          {item.name}
                        </h4>
                        
                        {/* Attributes */}
                        {Object.entries(item.attributes).length > 0 && (
                          <div className="space-y-1 mb-2 lg:mb-3">
                            {Object.entries(item.attributes).map(([attrName, values]) => (
                              <p key={attrName} className="font-cabin text-elite-black/60 text-xs sm:text-sm leading-tight">
                                <span className="font-semibold text-elite-burgundy/70">{attrName}:</span>{' '}
                                {values.map(v => v.valueName).join(', ')}
                                {values.some(v => v.priceExtra > 0) && (
                                  <span className="text-elite-burgundy font-medium">
                                    {' '}(+{values.reduce((sum, v) => sum + v.priceExtra, 0)} EGP)
                                  </span>
                                )}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Quantity and Price */}
                        <div className="flex items-center justify-between mt-3 lg:mt-4 gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 lg:gap-2 bg-elite-cream/50 rounded-2xl p-1.5 lg:p-2 border border-elite-burgundy/10">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1.5 lg:p-2 text-elite-burgundy hover:bg-elite-burgundy/10 active:bg-elite-burgundy/20 rounded-xl transition-all active:scale-90 touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed"
                                disabled={item.quantity <= 1}
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                              </button>
                              <span className="font-cabin font-bold text-elite-burgundy text-sm lg:text-base min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1.5 lg:p-2 text-elite-burgundy hover:bg-elite-burgundy/10 active:bg-elite-burgundy/20 rounded-xl transition-all active:scale-90 touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed"
                                disabled={item.quantity >= 50}
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="text-right flex-shrink-0">
                            <p className="font-cabin font-bold text-elite-burgundy text-base sm:text-lg lg:text-xl">
                              {item.totalPrice.toFixed(2)} EGP
                            </p>
                            {item.quantity > 1 && (
                              <p className="font-cabin text-elite-black/50 text-xs lg:text-sm">
                                {(item.totalPrice / item.quantity).toFixed(2)} EGP each
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Remove Button - Enhanced */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex-shrink-0 p-2 lg:p-2.5 text-red-500 hover:text-white hover:bg-red-500 active:bg-red-600 rounded-2xl transition-all active:scale-90 self-start touch-manipulation group shadow-sm hover:shadow-md"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer (Totals and Checkout) */}
          {items.length > 0 && (
            <div className="border-t-2 border-elite-burgundy/10 bg-white p-4 sm:p-6 lg:p-8">
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 lg:mb-8">
                <div className="flex justify-between font-cabin text-elite-black/70 text-sm sm:text-base lg:text-lg">
                  <span>Subtotal</span>
                  <span className="font-semibold">{subtotal.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between font-cabin text-elite-black/70 text-sm sm:text-base lg:text-lg">
                  <span>Tax (14%)</span>
                  <span className="font-semibold">{tax.toFixed(2)} EGP</span>
                </div>
                <div className="border-t-2 border-elite-burgundy/20 pt-2 sm:pt-3 flex justify-between font-calistoga text-elite-burgundy text-xl sm:text-2xl lg:text-3xl">
                  <span>Total</span>
                  <span>{total.toFixed(2)} EGP</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-elite-burgundy to-elite-dark-burgundy text-elite-cream py-4 sm:py-5 lg:py-6 rounded-2xl font-cabin font-bold text-base sm:text-lg lg:text-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 sm:gap-3 touch-manipulation min-h-[56px] lg:min-h-[64px] group"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </button>

              {status === 'unauthenticated' && (
                <p className="text-center font-cabin text-elite-black/50 text-xs sm:text-sm lg:text-base mt-3 lg:mt-4">
                  You'll need to sign in to complete your order
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
