"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CreditCard, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

interface PaymobAcceptConfig {
  publicKey: string;
  paymentKey: string;
  onReady?: () => void;
  onError?: (error: { message?: string }) => void;
  onClose?: () => void;
}

interface PaymobAccept {
  init: (config: PaymobAcceptConfig) => void;
  show: () => void;
  close: () => void;
}

declare global {
  interface Window {
    PaymobAccept: PaymobAccept;
  }
}

function PaymentProcessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { push } = useToast();
  
  const orderId = searchParams.get("orderId");
  const paymentKey = searchParams.get("paymentKey");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const initializePayment = useCallback(() => {
    if (!orderId || !paymentKey) {
      setError("Missing order ID or payment key");
      setLoading(false);
      return;
    }

    try {
      if (!window.PaymobAccept) {
        setError("Payment gateway not loaded");
        setLoading(false);
        return;
      }

      // Get public key from environment (should be passed from server)
      // For now, we'll get it from the API
      fetch("/api/payments/config")
        .then((res) => res.json())
        .then((data) => {
          if (!data.success || !data.data?.publicKey) {
            throw new Error("Failed to get payment configuration");
          }

          const publicKey = data.data.publicKey;

          // Initialize Paymob iframe
          window.PaymobAccept.init({
            publicKey,
            paymentKey,
            onReady: () => {
              setLoading(false);
            },
            onError: (err: { message?: string }) => {
              console.error("[Payment] Error:", err);
              setError(err.message || "Payment initialization failed");
              setLoading(false);
            },
            onClose: () => {
              // User closed payment window
              router.push(`/payment/callback?orderId=${orderId}&status=cancelled`);
            },
          });

          // Show payment iframe
          window.PaymobAccept.show();
          setProcessing(true);
        })
        .catch((err: unknown) => {
          console.error("[Payment] Config error:", err);
          setError((err as { message?: string })?.message || "Failed to initialize payment");
          setLoading(false);
        });
    } catch (err: unknown) {
      console.error("[Payment] Initialization error:", err);
      setError((err as { message?: string })?.message || "Payment initialization failed");
      setLoading(false);
    }
  }, [orderId, paymentKey, router]);

  useEffect(() => {
    if (!orderId || !paymentKey) {
      setError("Missing order ID or payment key");
      setLoading(false);
      return;
    }

    // Load Paymob Accept.js SDK
    const script = document.createElement("script");
    script.src = "https://accept.paymob.com/api/acceptance/iframes/accept.js";
    script.async = true;
    script.onload = () => {
      initializePayment();
    };
    script.onerror = () => {
      setError("Failed to load payment gateway");
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [orderId, paymentKey, initializePayment]);

  if (loading) {
    return (
      <div className="min-h-screen bg-elite-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-elite-burgundy mx-auto mb-4" />
          <p className="text-elite-burgundy font-cabin">Initializing payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-elite-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="font-calistoga text-2xl text-elite-burgundy mb-2">Payment Error</h2>
          <p className="font-cabin text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push(`/order`)}
            className="w-full bg-elite-burgundy text-elite-cream font-cabin py-3 rounded-xl hover:bg-elite-burgundy/90 transition-colors"
          >
            Return to Checkout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-elite-cream p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-8 h-8 text-elite-burgundy" />
            <h1 className="font-calistoga text-2xl text-elite-burgundy">Complete Payment</h1>
          </div>
          
          {processing && (
            <div className="mb-4">
              <p className="font-cabin text-gray-600 mb-4">
                Please complete your payment using the secure form below.
              </p>
              <div id="paymob-iframe-container" className="w-full min-h-[500px] border-2 border-gray-200 rounded-xl"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentProcessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-elite-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-elite-burgundy mx-auto mb-4" />
          <p className="text-elite-burgundy font-cabin">Loading...</p>
        </div>
      </div>
    }>
      <PaymentProcessContent />
    </Suspense>
  );
}
