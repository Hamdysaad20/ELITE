"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Demo page for testing optimistic cart updates
 * Access at: /test-optimistic
 */
export default function TestOptimisticPage() {
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    isUpdating,
    loading,
    error,
  } = useCart();
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  const runTest = async () => {
    try {
      setTestStatus("idle");
      // This should show instant UI update
      await addToCart("test-product-id", 1, { size: "Medium" });
      setTestStatus("success");
      setTimeout(() => setTestStatus("idle"), 2000);
    } catch (err) {
      setTestStatus("error");
      setTimeout(() => setTestStatus("idle"), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-elite-cream via-white to-elite-burgundy/5 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-calistoga text-4xl text-elite-burgundy mb-8">
          🧪 Optimistic UI Test Page
        </h1>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div
            className={cn(
              "p-4 rounded-lg border-2",
              loading
                ? "bg-blue-50 border-blue-300"
                : "bg-gray-50 border-gray-300",
            )}
          >
            <div className="font-cabin font-semibold mb-1">Loading</div>
            <div className="text-2xl">{loading ? "🔄" : "✓"}</div>
          </div>

          <div
            className={cn(
              "p-4 rounded-lg border-2",
              isUpdating
                ? "bg-yellow-50 border-yellow-300"
                : "bg-gray-50 border-gray-300",
            )}
          >
            <div className="font-cabin font-semibold mb-1">Updating</div>
            <div className="text-2xl">{isUpdating ? "⏳" : "✓"}</div>
          </div>

          <div
            className={cn(
              "p-4 rounded-lg border-2",
              error ? "bg-red-50 border-red-300" : "bg-gray-50 border-gray-300",
            )}
          >
            <div className="font-cabin font-semibold mb-1">Error</div>
            <div className="text-2xl">{error ? "❌" : "✓"}</div>
          </div>
        </div>

        {/* Test Button */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <h2 className="font-calistoga text-2xl text-elite-black mb-4">
            Test Optimistic Add to Cart
          </h2>
          <p className="font-cabin text-gray-700 mb-6">
            Click the button below. You should see instant feedback even before
            the server responds. Watch the "Updating" indicator - it shows
            background sync.
          </p>

          <button
            onClick={runTest}
            disabled={isUpdating}
            className={cn(
              "px-6 py-3 rounded-full font-calistoga text-lg transition-all",
              testStatus === "success" && "bg-emerald-600 text-white",
              testStatus === "error" && "bg-red-600 text-white",
              testStatus === "idle" &&
                !isUpdating &&
                "bg-elite-burgundy text-elite-cream hover:opacity-90",
              isUpdating &&
                "bg-elite-burgundy/50 text-elite-cream cursor-not-allowed",
            )}
          >
            {testStatus === "success" ? (
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                Success!
              </span>
            ) : testStatus === "error" ? (
              <span className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Failed
              </span>
            ) : isUpdating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Syncing...
              </span>
            ) : (
              "Add Test Item to Cart"
            )}
          </button>
        </div>

        {/* Cart Display */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="font-calistoga text-2xl text-elite-black mb-4">
            Cart Contents (Optimistic State)
          </h2>

          {cart?.items.length ? (
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-elite-cream/30 rounded-lg"
                >
                  <div>
                    <div className="font-cabin font-semibold">
                      Item: {item.menuItemId}
                    </div>
                    <div className="font-cabin text-sm text-gray-600">
                      Quantity: {item.quantity} | Price: EGP {item.price}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-cabin"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="pt-4 border-t border-gray-200">
                <div className="font-calistoga text-xl text-elite-burgundy">
                  Total: EGP{" "}
                  {cart.items
                    .reduce((sum, item) => sum + item.price, 0)
                    .toFixed(2)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 font-cabin">
              Cart is empty. Try adding a test item!
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
          <h3 className="font-calistoga text-xl text-blue-900 mb-3">
            🎯 What to Look For:
          </h3>
          <ul className="space-y-2 font-cabin text-blue-800">
            <li>• Click "Add Test Item" - Button changes instantly</li>
            <li>• "Updating" indicator shows yellow during background sync</li>
            <li>• No waiting for server - UI responds immediately</li>
            <li>• If error occurs, optimistic update auto-reverts</li>
            <li>• Watch DevTools Network tab for background request</li>
          </ul>
        </div>

        {/* Error Recovery Test */}
        <div className="mt-8 bg-orange-50 border-2 border-orange-300 rounded-xl p-6">
          <h3 className="font-calistoga text-xl text-orange-900 mb-3">
            🔄 Test Error Recovery:
          </h3>
          <ol className="space-y-2 font-cabin text-orange-800 list-decimal list-inside">
            <li>Open DevTools → Network tab</li>
            <li>Set throttling to "Offline"</li>
            <li>Click "Add Test Item"</li>
            <li>Notice request fails, UI reverts</li>
            <li>Switch back to "Online"</li>
            <li>Click again - should work with auto-retry</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
