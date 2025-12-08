"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import { Mail, CheckCircle2, AlertCircle, ArrowLeft, Coffee, Info, RefreshCw } from "lucide-react";

function VerifyRequestContent() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email");
  const [showSecurityTip, setShowSecurityTip] = useState(false);

  return (
    <div className="min-h-screen bg-elite-burgundy flex items-center justify-center px-4 sm:px-6 py-6 sm:py-12 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 bg-elite-cream rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-elite-dark-burgundy rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 lg:p-12 space-y-6 sm:space-y-8 md:space-y-10">
          {/* Success Icon */}
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="mx-auto h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl animate-bounce-slow">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" />
            </div>
            <div>
              <h1 className="font-calistoga text-elite-burgundy text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-3 sm:mb-4 leading-tight px-2">
                Check Your Email
              </h1>
              <p className="font-cabin text-elite-black/60 text-lg sm:text-xl md:text-2xl font-light mb-3 px-2">
                We've sent a magic link to
              </p>
              {email && (
                <div className="bg-elite-cream/50 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 inline-flex items-center gap-2 sm:gap-3 mt-3 max-w-full">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-elite-burgundy flex-shrink-0" />
                  <p className="font-cabin font-bold text-elite-burgundy text-base sm:text-lg md:text-xl break-all">
                    {email}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4 sm:space-y-6">
            {/* What's next */}
            <div className="bg-gradient-to-br from-elite-cream/40 to-elite-cream/20 border-2 border-elite-burgundy/20 rounded-2xl p-5 sm:p-6 md:p-8">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-elite-burgundy rounded-full flex items-center justify-center flex-shrink-0">
                  <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-elite-cream" />
                </div>
                <h3 className="font-calistoga text-elite-burgundy text-xl sm:text-2xl md:text-3xl">
                  What's Next?
                </h3>
              </div>
              <div className="space-y-4 sm:space-y-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-elite-burgundy text-elite-cream rounded-2xl flex items-center justify-center text-base sm:text-lg font-bold font-cabin shadow-lg">1</span>
                  <div className="pt-0.5 sm:pt-1">
                    <p className="font-cabin text-elite-black text-base sm:text-lg md:text-xl font-semibold">Open your email inbox</p>
                    <p className="font-cabin text-elite-black/60 text-sm sm:text-base mt-0.5 sm:mt-1">Check your primary folder first</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-elite-burgundy text-elite-cream rounded-2xl flex items-center justify-center text-base sm:text-lg font-bold font-cabin shadow-lg">2</span>
                  <div className="pt-0.5 sm:pt-1">
                    <p className="font-cabin text-elite-black text-base sm:text-lg md:text-xl font-semibold">Click the magic link</p>
                    <p className="font-cabin text-elite-black/60 text-sm sm:text-base mt-0.5 sm:mt-1">It's safe and takes just one click</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-elite-burgundy text-elite-cream rounded-2xl flex items-center justify-center text-base sm:text-lg font-bold font-cabin shadow-lg">3</span>
                  <div className="pt-0.5 sm:pt-1">
                    <p className="font-cabin text-elite-black text-base sm:text-lg md:text-xl font-semibold">You're in!</p>
                    <p className="font-cabin text-elite-black/60 text-sm sm:text-base mt-0.5 sm:mt-1">Start enjoying your coffee journey ☕</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security tip */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <button
                    onMouseEnter={() => setShowSecurityTip(true)}
                    onMouseLeave={() => setShowSecurityTip(false)}
                    onClick={() => setShowSecurityTip(!showSecurityTip)}
                    className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-200 rounded-full flex items-center justify-center hover:bg-blue-300 active:scale-90 transition-all relative touch-manipulation"
                  >
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
                    {showSecurityTip && (
                      <>
                        {/* Mobile: Bottom centered */}
                        <div className="sm:hidden absolute left-1/2 -translate-x-1/2 top-14 w-[calc(100vw-3rem)] max-w-sm bg-blue-700 text-white text-sm p-4 rounded-2xl shadow-2xl z-20 font-cabin border-2 border-blue-400/30">
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-700 border-l-2 border-t-2 border-blue-400/30 transform rotate-45"></div>
                          Your security is our priority! This link is unique to you and expires after 24 hours.
                        </div>
                        {/* Desktop: Left positioned */}
                        <div className="hidden sm:block absolute left-0 top-14 w-72 bg-blue-700 text-white text-sm p-4 rounded-2xl shadow-2xl z-20 font-cabin border-2 border-blue-400/30">
                          <div className="absolute -top-2 left-6 w-4 h-4 bg-blue-700 border-l-2 border-t-2 border-blue-400/30 transform rotate-45"></div>
                          Your security is our priority! This link is unique to you and expires after 24 hours.
                        </div>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-cabin text-blue-900 text-sm sm:text-base md:text-lg leading-relaxed">
                  <p className="font-bold mb-1">Security First</p>
                  <p>This magic link expires in 24 hours and can only be used once for your safety.</p>
                </div>
              </div>
            </div>

            {/* Didn't receive email? */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 text-center space-y-3 sm:space-y-4">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" />
                <p className="font-cabin font-bold text-amber-900 text-lg sm:text-xl">
                  Didn't receive the email?
                </p>
              </div>
              <div className="space-y-2 sm:space-y-3 font-cabin text-sm sm:text-base text-amber-800">
                <p className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-amber-600 rounded-full flex-shrink-0"></span>
                  <span>Check your spam or junk folder</span>
                </p>
                <p className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-amber-600 rounded-full flex-shrink-0"></span>
                  <span>Make sure the email address is correct</span>
                </p>
                <p className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-amber-600 rounded-full flex-shrink-0"></span>
                  <span>Wait a few minutes and check again</span>
                </p>
              </div>
            </div>
          </div>

          {/* Footer - Big Buttons */}
          <div className="pt-4 sm:pt-6 border-t-2 border-elite-burgundy/10 space-y-3 sm:space-y-4">
            <Link
              href="/auth/signin"
              className="w-full bg-elite-burgundy hover:bg-elite-dark-burgundy text-elite-cream font-cabin font-bold text-base sm:text-lg py-4 sm:py-5 px-6 sm:px-8 rounded-2xl text-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 sm:gap-3 touch-manipulation min-h-[56px]"
            >
              <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>Try a Different Email</span>
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 sm:gap-3 text-elite-burgundy hover:text-elite-dark-burgundy active:scale-95 font-cabin font-bold text-base sm:text-lg py-4 transition-all duration-300 group touch-manipulation"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-1 transition-transform duration-300" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyRequestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-elite-burgundy flex items-center justify-center">
        <div className="text-elite-cream font-cabin text-xl">Loading...</div>
      </div>
    }>
      <VerifyRequestContent />
    </Suspense>
  );
}


