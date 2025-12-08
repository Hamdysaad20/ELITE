"use client";

import { X, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { useLocalCart } from "@/hooks/useLocalCart";
import QuantitySelector from "./QuantitySelector";
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
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-[480px] bg-elite-cream shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-elite-burgundy text-elite-cream p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6" />
                <h2 className="font-calistoga text-2xl">
                  Shopping Cart
                  {itemCount > 0 && (
                    <span className="ml-2 text-elite-cream/80">({itemCount})</span>
                  )}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-elite-cream/20 rounded-full transition-colors"
                aria-label="Close cart"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart className="w-24 h-24 text-elite-burgundy/20 mb-4" />
                <h3 className="font-calistoga text-elite-burgundy text-xl mb-2">
                  Your cart is empty
                </h3>
                <p className="font-cabin text-elite-black/60 mb-6">
                  Start adding some delicious items!
                </p>
                <button
                  onClick={onClose}
                  className="bg-elite-burgundy text-elite-cream px-8 py-3 rounded-full font-cabin font-medium hover:bg-elite-dark-burgundy transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 shadow-md"
                  >
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-elite-cream flex-shrink-0">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-b from-elite-burgundy/5 to-elite-burgundy/10" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-calistoga text-elite-burgundy text-lg mb-1 truncate">
                          {item.name}
                        </h4>
                        
                        {/* Attributes */}
                        {Object.entries(item.attributes).length > 0 && (
                          <div className="space-y-0.5 mb-2">
                            {Object.entries(item.attributes).map(([attrName, values]) => (
                              <p key={attrName} className="font-cabin text-elite-black/60 text-xs">
                                <span className="font-medium">{attrName}:</span>{' '}
                                {values.map(v => v.valueName).join(', ')}
                                {values.some(v => v.priceExtra > 0) && (
                                  <span className="text-elite-burgundy">
                                    {' '}(+{values.reduce((sum, v) => sum + v.priceExtra, 0)} EGP)
                                  </span>
                                )}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Quantity and Price */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 scale-75 origin-left">
                            <QuantitySelector
                              value={item.quantity}
                              onChange={(qty) => updateQuantity(item.id, qty)}
                              min={1}
                              max={50}
                            />
                          </div>
                          
                          <div className="text-right">
                            <p className="font-cabin font-bold text-elite-burgundy text-lg">
                              {item.totalPrice} EGP
                            </p>
                            {item.quantity > 1 && (
                              <p className="font-cabin text-elite-black/50 text-xs">
                                {(item.totalPrice / item.quantity).toFixed(2)} EGP each
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer (Totals and Checkout) */}
          {items.length > 0 && (
            <div className="border-t border-elite-burgundy/10 bg-white p-6">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between font-cabin text-elite-black/70">
                  <span>Subtotal</span>
                  <span>{subtotal.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between font-cabin text-elite-black/70">
                  <span>Tax (14%)</span>
                  <span>{tax.toFixed(2)} EGP</span>
                </div>
                <div className="border-t border-elite-burgundy/10 pt-3 flex justify-between font-calistoga text-elite-burgundy text-xl">
                  <span>Total</span>
                  <span>{total.toFixed(2)} EGP</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-elite-burgundy to-elite-dark-burgundy text-elite-cream py-4 rounded-2xl font-cabin font-bold text-lg hover:scale-105 transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              {status === 'unauthenticated' && (
                <p className="text-center font-cabin text-elite-black/50 text-sm mt-3">
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
