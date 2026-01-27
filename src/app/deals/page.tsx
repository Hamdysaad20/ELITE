"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import MobileHeader from "@/components/MobileHeader";
import Footer from "@/components/Footer";
import { Sparkles } from "lucide-react";

/**
 * Deals page - Currently disabled
 * This page will be enabled in the future when deals feature is ready
 */
export default function DealsPage() {
  const router = useRouter();

  // Redirect to home page
  useEffect(() => {
    router.replace("/");
  }, [router]);

  // Show coming soon message while redirecting
  return (
    <>
      <MobileHeader title="Deals" showBack={true} transparent={true} />
      <div className="min-h-screen bg-elite-burgundy flex items-center justify-center">
        <div className="text-center px-6">
          <div className="mb-6">
            <Sparkles className="w-16 h-16 text-elite-cream mx-auto animate-pulse" />
          </div>
          <h1 className="font-calistoga text-4xl md:text-5xl text-elite-cream mb-4">
            Coming Soon
          </h1>
          <p className="font-cabin text-xl text-elite-cream/90 max-w-md mx-auto">
            Deals will be available soon. Check back later for exclusive offers!
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
