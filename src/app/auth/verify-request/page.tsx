"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Mail, CheckCircle2, ArrowLeft } from "lucide-react";

function VerifyRequestContent() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email");

  return (
    <main className="min-h-screen bg-elite-cream">
      {/* Hero Section */}
      <div className="bg-elite-burgundy relative overflow-hidden py-12 sm:py-16 md:py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-5 left-5 w-20 h-20 bg-elite-burgundy rounded-full blur-2xl"></div>
          <div className="absolute bottom-5 right-5 w-32 h-32 bg-elite-cream rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-6 sm:px-8 text-center z-10">
          <div className="inline-flex items-center justify-center mb-4 p-3 bg-elite-cream/20 rounded-full">
            <CheckCircle2 className="w-6 h-6 text-elite-cream" />
          </div>
          <h1 className="font-calistoga text-elite-cream text-3xl sm:text-4xl md:text-5xl font-bold mb-3 leading-tight">
            Check Your Email
          </h1>
          <p className="font-cabin text-elite-cream/90 text-base sm:text-lg mb-4">
            We've sent a magic link to
          </p>
          {email && (
            <div className="inline-flex items-center gap-2 bg-elite-cream/15 border border-elite-cream/30 rounded-full px-4 sm:px-6 py-2 sm:py-3">
              <Mail className="w-4 h-4 text-elite-cream flex-shrink-0" />
              <p className="font-cabin font-semibold text-elite-cream text-sm sm:text-base break-all">
                {email}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-12 sm:py-16 md:py-20">
        {/* Next Steps Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-6 sm:p-8 md:p-10 mb-8 hover:shadow-2xl hover:border-elite-burgundy/20 transition-all duration-300">
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="p-2 sm:p-3 bg-elite-burgundy/10 rounded-2xl flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-elite-burgundy" />
            </div>
            <h2 className="font-calistoga text-elite-burgundy text-2xl sm:text-3xl font-bold">
              What Happens Next
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4 pl-2 sm:pl-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-elite-burgundy text-elite-cream flex items-center justify-center flex-shrink-0 font-cabin font-bold text-sm sm:text-base">
                1
              </div>
              <div className="pt-0.5 sm:pt-1">
                <p className="font-cabin text-elite-black font-semibold text-sm sm:text-base">Check your inbox for the email</p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-elite-burgundy text-elite-cream flex items-center justify-center flex-shrink-0 font-cabin font-bold text-sm sm:text-base">
                2
              </div>
              <div className="pt-0.5 sm:pt-1">
                <p className="font-cabin text-elite-black font-semibold text-sm sm:text-base">Click the magic link inside</p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-elite-burgundy text-elite-cream flex items-center justify-center flex-shrink-0 font-cabin font-bold text-sm sm:text-base">
                3
              </div>
              <div className="pt-0.5 sm:pt-1">
                <p className="font-cabin text-elite-black font-semibold text-sm sm:text-base">You're all set and verified ✨</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Security Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border-2 border-elite-burgundy/5 p-5 sm:p-6 hover:shadow-xl hover:border-elite-burgundy/15 transition-all duration-300 group">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <span className="text-xl sm:text-2xl">🔐</span>
              <h3 className="font-calistoga text-elite-burgundy text-lg sm:text-xl font-bold">Safe & Secure</h3>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="font-cabin text-elite-black/80 flex items-start gap-2">
                <span className="flex-shrink-0">✓</span>
                <span>Link expires in 24 hours</span>
              </li>
              <li className="font-cabin text-elite-black/80 flex items-start gap-2">
                <span className="flex-shrink-0">✓</span>
                <span>Single-use only</span>
              </li>
              <li className="font-cabin text-elite-black/80 flex items-start gap-2">
                <span className="flex-shrink-0">✓</span>
                <span>No password needed</span>
              </li>
            </ul>
          </div>

          {/* Help Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border-2 border-elite-burgundy/5 p-5 sm:p-6 hover:shadow-xl hover:border-elite-burgundy/15 transition-all duration-300 group">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <span className="text-xl sm:text-2xl">💬</span>
              <h3 className="font-calistoga text-elite-burgundy text-lg sm:text-xl font-bold">No Email?</h3>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="font-cabin text-elite-black/80 flex items-start gap-2">
                <span className="flex-shrink-0">→</span>
                <span>Check your spam folder</span>
              </li>
              <li className="font-cabin text-elite-black/80 flex items-start gap-2">
                <span className="flex-shrink-0">→</span>
                <span>Verify the email address</span>
              </li>
              <li className="font-cabin text-elite-black/80 flex items-start gap-2">
                <span className="flex-shrink-0">→</span>
                <span>Wait 1-2 minutes and refresh</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <Link
            href="/auth/signin"
            className="w-full bg-elite-burgundy hover:bg-elite-dark-burgundy text-elite-cream font-cabin font-semibold text-sm sm:text-base py-3 sm:py-3.5 px-6 rounded-2xl sm:rounded-3xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Try Different Email</span>
          </Link>
          <Link
            href="/"
            className="w-full bg-elite-cream border-2 border-elite-burgundy text-elite-burgundy hover:bg-elite-burgundy/5 font-cabin font-semibold text-sm sm:text-base py-3 sm:py-3.5 px-6 rounded-2xl sm:rounded-3xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 group"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform duration-300" />
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
        <div className="min-h-screen bg-elite-burgundy flex items-center justify-center">
          <div className="text-elite-cream font-cabin text-xl">Loading...</div>
        </div>
      }
    >
      <VerifyRequestContent />
    </Suspense>
  );
}
