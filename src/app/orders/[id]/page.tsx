"use client";

import { useParams } from "next/navigation";
import { useRequireAuth } from "@/lib/auth/hooks";
import { OrderDetailCard } from "@/components/OrderDetailCard";
import Footer from "@/components/Footer";
import MobileHeader from "@/components/MobileHeader";
import SwipeIndicator from "@/components/SwipeIndicator";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useTranslations } from "next-intl";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const { isLoading: authLoading } = useRequireAuth();
  const t = useTranslations("orderDetailPage");

  // Enable swipe-back gesture
  const { swipeProgress, isSwipingBack } = useSwipeBack({ enabled: true });

  if (authLoading) {
    return (
      <>
        <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
        <MobileHeader title={t("title")} showBack={true} />
        <div
          className="min-h-screen bg-elite-cream flex items-center justify-center md:pt-0"
          style={{
            paddingTop: "calc(max(env(safe-area-inset-top), 8px) + 62px)",
          }}
        >
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-elite-burgundy border-t-transparent" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
      <MobileHeader title={t("title")} showBack={true} />
      <div
        className="min-h-screen bg-elite-cream pb-24 md:pb-8 md:pt-0"
        style={{
          paddingTop: "calc(max(env(safe-area-inset-top), 8px) + 62px)",
        }}
      >
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 md:pt-12">
          <OrderDetailCard orderId={orderId} />
        </div>
      </div>
      <Footer />
    </>
  );
}
