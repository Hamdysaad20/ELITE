"use client";

import Footer from "@/components/Footer";
import { Tag, Sparkles, Gift, Percent } from "lucide-react";

export default function DealsPage() {
  return (
    <>
      <main className="min-h-screen bg-elite-cream pb-24 md:pb-0">
        {/* Hero Section */}
        <div className="bg-elite-burgundy text-elite-cream py-12 sm:py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-elite-cream/10 mb-6 sm:mb-8">
              <Tag className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h1 className="font-calistoga text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 sm:mb-6">
              Amazing Deals
              <br />
              <span className="text-elite-cream/80">Coming Soon</span>
            </h1>
            <p className="font-cabin text-base sm:text-lg md:text-xl max-w-2xl mx-auto text-elite-cream/90">
              We're preparing incredible combo offers and flash deals for you. Stay tuned!
            </p>
          </div>
        </div>

        {/* Preview Features */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
          <h2 className="font-calistoga text-elite-burgundy text-2xl sm:text-3xl md:text-4xl text-center mb-8 sm:mb-12">
            What's Coming
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Combo Offers */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-elite-burgundy/10 hover:border-elite-burgundy/30 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-elite-burgundy/10 flex items-center justify-center mb-4 sm:mb-6">
                <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-elite-burgundy" />
              </div>
              <h3 className="font-calistoga text-elite-black text-xl sm:text-2xl mb-3">
                Combo Offers
              </h3>
              <p className="font-cabin text-elite-black/70 text-sm sm:text-base">
                Bundle your favorite drinks and snacks at special prices
              </p>
            </div>

            {/* Flash Sales */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-elite-burgundy/10 hover:border-elite-burgundy/30 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-elite-burgundy/10 flex items-center justify-center mb-4 sm:mb-6">
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-elite-burgundy" />
              </div>
              <h3 className="font-calistoga text-elite-black text-xl sm:text-2xl mb-3">
                Flash Sales
              </h3>
              <p className="font-cabin text-elite-black/70 text-sm sm:text-base">
                Limited-time offers on your favorite items
              </p>
            </div>

            {/* Member Discounts */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-elite-burgundy/10 hover:border-elite-burgundy/30 hover:shadow-xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-elite-burgundy/10 flex items-center justify-center mb-4 sm:mb-6">
                <Percent className="w-6 h-6 sm:w-7 sm:h-7 text-elite-burgundy" />
              </div>
              <h3 className="font-calistoga text-elite-black text-xl sm:text-2xl mb-3">
                Member Discounts
              </h3>
              <p className="font-cabin text-elite-black/70 text-sm sm:text-base">
                Exclusive deals for registered members
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 sm:mt-16 text-center">
            <div className="bg-elite-burgundy/5 border-2 border-elite-burgundy/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 max-w-2xl mx-auto">
              <p className="font-cabin text-elite-black/70 text-sm sm:text-base mb-4 sm:mb-6">
                Want to be notified when deals go live?
              </p>
              <button className="bg-elite-burgundy text-elite-cream px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-cabin font-bold text-sm sm:text-base hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 touch-manipulation">
                Join the Waitlist
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}
