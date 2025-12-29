"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const orderId = searchParams.get("orderId");
  const status = searchParams.get("status"); // 'success', 'failed', 'cancelled'
  
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<{
    status: string;
    paymobTransactionId: string | null;
    amount: number;
    paidAt: Date | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    // Poll payment status
    const checkPaymentStatus = async () => {
      try {
        const res = await fetch(`/api/payments/status/${orderId}`);
        const json = await res.json();
        
        if (json.success && json.data) {
          setPaymentStatus(json.data.status);
          setOrderData(json.data);
          
          // If payment is still pending, poll again
          if (json.data.status === "pending") {
            setTimeout(checkPaymentStatus, 2000); // Poll every 2 seconds
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("[Payment Callback] Error:", err);
        setLoading(false);
      }
    };

    // Initial check
    checkPaymentStatus();

    // Also check URL status parameter
    if (status) {
      setPaymentStatus(status);
      setLoading(false);
    }
  }, [orderId, status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-elite-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-elite-burgundy mx-auto mb-4" />
          <p className="text-elite-burgundy font-cabin">Checking payment status...</p>
        </div>
      </div>
    );
  }

  const isSuccess = paymentStatus === "success" || paymentStatus === "paid";
  const isFailed = paymentStatus === "failed" || paymentStatus === "cancelled";
  const isPending = paymentStatus === "pending";

  return (
    <div className="min-h-screen bg-elite-cream flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        {isSuccess && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="font-calistoga text-2xl text-elite-burgundy mb-2">Payment Successful!</h2>
            <p className="font-cabin text-gray-600 mb-6">
              Your order has been confirmed and payment has been processed.
            </p>
            {orderId && (
              <Link
                href={`/orders/${orderId}`}
                className="block w-full bg-elite-burgundy text-elite-cream font-cabin py-3 rounded-xl hover:bg-elite-burgundy/90 transition-colors mb-3"
              >
                View Order
              </Link>
            )}
            <Link
              href="/"
              className="block w-full bg-gray-100 text-elite-burgundy font-cabin py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Continue Shopping
            </Link>
          </>
        )}

        {isFailed && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="font-calistoga text-2xl text-elite-burgundy mb-2">Payment Failed</h2>
            <p className="font-cabin text-gray-600 mb-6">
              {paymentStatus === "cancelled"
                ? "Payment was cancelled. Your order is still pending."
                : "Payment could not be processed. Please try again."}
            </p>
            {orderId && (
              <Link
                href={`/order?retry=${orderId}`}
                className="block w-full bg-elite-burgundy text-elite-cream font-cabin py-3 rounded-xl hover:bg-elite-burgundy/90 transition-colors mb-3"
              >
                Retry Payment
              </Link>
            )}
            <Link
              href="/"
              className="block w-full bg-gray-100 text-elite-burgundy font-cabin py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Return Home
            </Link>
          </>
        )}

        {isPending && (
          <>
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="font-calistoga text-2xl text-elite-burgundy mb-2">Payment Pending</h2>
            <p className="font-cabin text-gray-600 mb-6">
              Your payment is being processed. Please wait...
            </p>
            <Link
              href="/"
              className="block w-full bg-gray-100 text-elite-burgundy font-cabin py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Return Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-elite-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-elite-burgundy mx-auto mb-4" />
          <p className="text-elite-burgundy font-cabin">Loading...</p>
        </div>
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}
