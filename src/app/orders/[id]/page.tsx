"use client";

import { useParams } from "next/navigation";
import { useRequireAuth } from "@/lib/auth/hooks";
import { OrderDetailCard } from "@/components/OrderDetailCard";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const { isLoading: authLoading } = useRequireAuth();

  if (authLoading) {
    return (
      <main>
        <div className="min-h-screen bg-elite-cream flex items-center justify-center">
          <div className="animate-pulse text-elite-black/70 font-cabin">
            Loading...
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main>
      <div className="min-h-screen bg-elite-cream">
        {/* Header */}
        <div className="bg-elite-burgundy text-elite-cream py-8">
          <div className="max-w-7xl mx-auto px-6">
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 text-elite-cream/80 hover:text-elite-cream transition-colors mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="font-cabin text-sm">Back to Orders</span>
            </Link>
            <h1 className="font-calistoga text-4xl md:text-5xl">
              Order Details
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <OrderDetailCard orderId={orderId} />
        </div>
      </div>
      <Footer />
    </main>
  );
}


