"use client";

import { useParams } from "next/navigation";
import { useRequireAuth } from "@/lib/auth/hooks";
import { OrderDetailCard } from "@/components/OrderDetailCard";
import Footer from "@/components/Footer";
import MobileHeader from "@/components/MobileHeader";
import SwipeIndicator from "@/components/SwipeIndicator";
import { useSwipeBack } from "@/hooks/useSwipeBack";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const { isLoading: authLoading } = useRequireAuth();

  // Enable swipe-back gesture
  const { swipeProgress, isSwipingBack } = useSwipeBack({ enabled: true });

  if (authLoading) {
    return (
      <>
        <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
        <MobileHeader title="Order Details" showBack={true} />
        <main className="min-h-screen bg-elite-cream flex items-center justify-center pt-16 md:pt-0">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-elite-burgundy border-t-transparent" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
      <MobileHeader title="Order Details" showBack={true} />
      <main className="min-h-screen bg-elite-cream pb-32 md:pb-8 pt-16 md:pt-0">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 md:pt-12">
          <OrderDetailCard orderId={orderId} />
        </div>
      </main>
      <Footer />
    </>
  );
}
