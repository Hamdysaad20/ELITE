"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileNavigation from "@/components/MobileNavigation";

export default function DealsPage() {
  return (
    <main className="min-h-screen bg-elite-cream">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center">
          <h1 className="font-calistoga text-elite-burgundy text-4xl sm:text-5xl md:text-6xl mb-6">
            Amazing Deals Coming Soon
          </h1>
          <p className="font-cabin text-elite-black/70 text-lg sm:text-xl max-w-2xl mx-auto">
            We're preparing incredible combo offers and flash deals for you. Stay tuned!
          </p>
        </div>
      </div>
      
      <Footer />
      <MobileNavigation />
    </main>
  );
}
