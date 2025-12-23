"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { Mail, CheckCircle2, ArrowLeft, RefreshCw, Shield, Clock, Sparkles } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";

function VerifyRequestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams?.get("email");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-elite-cream pb-24 md:pb-0">
      {/* Mobile Header */}
      <MobileHeader 
        title="" 
        showBack={true} 
        onBack={() => router.push("/auth/signin")}
      />
      
      {/* Compact Hero Section for Mobile */}
      <div className="bg-elite-burgundy relative overflow-hidden pt-20 pb-10 md:pt-16 md:pb-16">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-8 -left-8 w-32 h-32 bg-elite-cream/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-elite-cream/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-lg mx-auto px-5 text-center z-10">
          {/* Animated check icon */}
          <div 
            className={`inline-flex items-center justify-center mb-5 w-16 h-16 bg-elite-cream/15 rounded-full border border-elite-cream/20 transition-all duration-500 ${mounted ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
          >
            <Mail className="w-7 h-7 text-elite-cream" />
          </div>
          
          <h1 
            className={`font-calistoga text-elite-cream text-2xl sm:text-3xl md:text-4xl font-bold mb-3 transition-all duration-500 delay-100 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            Check Your Email
          </h1>
          
          <p 
            className={`font-cabin text-elite-cream/85 text-sm sm:text-base mb-4 transition-all duration-500 delay-150 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            We've sent a magic link to
          </p>
          
          {email && (
            <div 
              className={`inline-flex items-center gap-2.5 bg-elite-cream/10 backdrop-blur-sm border border-elite-cream/25 rounded-2xl px-5 py-3 transition-all duration-500 delay-200 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            >
              <div className="w-8 h-8 rounded-full bg-elite-cream/15 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-elite-cream" />
              </div>
              <p className="font-cabin font-semibold text-elite-cream text-sm break-all text-left">
                {email}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content Section - Optimized for mobile */}
      <div className="max-w-lg mx-auto px-4 py-6 md:py-10">
        {/* Steps Card - Rounded design */}
        <div 
          className={`bg-white rounded-3xl shadow-lg border border-elite-burgundy/8 p-6 mb-5 transition-all duration-500 delay-250 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 bg-elite-burgundy/10 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-elite-burgundy" />
            </div>
            <h2 className="font-calistoga text-elite-burgundy text-xl font-bold">
              Next Steps
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { num: 1, text: "Check your inbox for the email" },
              { num: 2, text: "Click the magic link inside" },
              { num: 3, text: "You're all set! ✨" },
            ].map((step, i) => (
              <div 
                key={step.num}
                className={`flex items-center gap-3 transition-all duration-300`}
                style={{ transitionDelay: `${300 + i * 50}ms` }}
              >
                <div className="w-8 h-8 rounded-full bg-elite-burgundy text-elite-cream flex items-center justify-center flex-shrink-0 font-cabin font-bold text-sm">
                  {step.num}
                </div>
                <p className="font-cabin text-elite-black font-medium text-sm flex-1">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Info Cards - Horizontal scroll on mobile */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 mb-5 snap-x snap-mandatory">
          {/* Security Card */}
          <div className="flex-shrink-0 w-[280px] snap-start bg-white rounded-3xl shadow-md border border-elite-burgundy/8 p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-elite-burgundy/10 flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-elite-burgundy" />
              </div>
              <h3 className="font-calistoga text-elite-burgundy text-base font-bold">Safe & Secure</h3>
            </div>
            <ul className="space-y-2.5">
              {["Link expires in 24 hours", "Single-use only", "No password needed"].map((item, i) => (
                <li key={i} className="font-cabin text-elite-black/70 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Card */}
          <div className="flex-shrink-0 w-[280px] snap-start bg-white rounded-3xl shadow-md border border-elite-burgundy/8 p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-elite-burgundy/10 flex items-center justify-center">
                <Clock className="w-4.5 h-4.5 text-elite-burgundy" />
              </div>
              <h3 className="font-calistoga text-elite-burgundy text-base font-bold">No Email?</h3>
            </div>
            <ul className="space-y-2.5">
              {["Check your spam folder", "Verify the email address", "Wait 1-2 minutes"].map((item, i) => (
                <li key={i} className="font-cabin text-elite-black/70 text-xs flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-elite-burgundy/10 flex items-center justify-center text-elite-burgundy text-[10px]">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Buttons - Rounded pill style */}
        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="w-full bg-elite-burgundy text-elite-cream font-cabin font-bold text-sm py-4.5 px-6 rounded-full flex items-center justify-center gap-2.5 shadow-lg shadow-elite-burgundy/25 active:scale-[0.97] transition-all touch-manipulation"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Different Email</span>
          </Link>
          
          <Link
            href="/"
            className="w-full bg-white border-2 border-elite-burgundy/15 text-elite-burgundy font-cabin font-bold text-sm py-4.5 px-6 rounded-full flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.97] transition-all touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Shop</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function VerifyRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-elite-cream flex items-center justify-center">
          <div className="w-12 h-12 border-3 border-elite-burgundy border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyRequestContent />
    </Suspense>
  );
}
