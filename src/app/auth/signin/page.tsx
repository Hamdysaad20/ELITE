"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Coffee, Mail, ArrowLeft, Info } from "lucide-react";

function SignInContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting sign in with email:", email);
      
      const result = await signIn("email", {
        email,
        callbackUrl,
        redirect: false,
      });

      console.log("Sign in result:", result);

      if (result?.error) {
        console.error("Sign in error:", result.error);
        setError(result.error);
        setLoading(false);
      } else if (result?.ok) {
        // Redirect to verify request page
        router.push("/auth/verify-request?email=" + encodeURIComponent(email));
      } else {
        console.error("Unexpected sign in result:", result);
        setError("Unable to send sign in link. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Sign in exception:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-elite-burgundy flex items-center justify-center px-4 sm:px-6 py-6 sm:py-12 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 bg-elite-cream rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-elite-dark-burgundy rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-lg w-full relative z-10">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-elite-cream hover:text-white active:scale-95 transition-all duration-300 mb-6 sm:mb-8 font-cabin text-base sm:text-lg group touch-manipulation"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-semibold">Back to Home</span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-12 space-y-6 sm:space-y-8 md:space-y-10">
          {/* Logo/Header */}
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="mx-auto h-20 w-20 sm:h-24 sm:w-24 bg-gradient-to-br from-elite-burgundy to-elite-dark-burgundy rounded-full flex items-center justify-center shadow-xl">
              <Coffee className="w-10 h-10 sm:w-12 sm:h-12 text-elite-cream" />
            </div>
            <div>
              <h1 className="font-calistoga text-elite-burgundy text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 sm:mb-3 leading-tight px-2">
                Welcome Back
              </h1>
              <p className="font-cabin text-elite-black/60 text-lg sm:text-xl md:text-2xl font-light px-2">
                Sign in to continue your coffee journey
              </p>
            </div>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="email" 
                  className="block font-cabin font-bold text-elite-black text-base sm:text-lg"
                >
                  Email Address
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={() => setShowTooltip(!showTooltip)}
                    className="text-elite-burgundy/60 hover:text-elite-burgundy active:scale-90 transition-all touch-manipulation p-2 -m-2"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                  {showTooltip && (
                    <>
                      {/* Mobile: Bottom positioned */}
                      <div className="sm:hidden absolute left-1/2 -translate-x-1/2 top-12 w-[calc(100vw-3rem)] max-w-sm bg-elite-burgundy text-elite-cream text-sm p-4 rounded-2xl shadow-2xl z-20 font-cabin border-2 border-elite-cream/20">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-elite-burgundy border-l-2 border-t-2 border-elite-cream/20 transform rotate-45"></div>
                        We'll send you a secure magic link - no password needed! Just click the link in your email to sign in.
                      </div>
                      {/* Desktop: Right positioned */}
                      <div className="hidden sm:block absolute right-0 top-10 w-72 bg-elite-burgundy text-elite-cream text-sm p-4 rounded-2xl shadow-2xl z-20 font-cabin border-2 border-elite-cream/20">
                        <div className="absolute -top-2 right-6 w-4 h-4 bg-elite-burgundy border-l-2 border-t-2 border-elite-cream/20 transform rotate-45"></div>
                        We'll send you a secure magic link - no password needed! Just click the link in your email to sign in.
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="relative">
                <Mail className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-elite-burgundy/50" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-4 sm:py-5 border-2 border-elite-burgundy/20 rounded-2xl font-cabin text-base sm:text-lg text-elite-black placeholder-elite-black/40 focus:outline-none focus:border-elite-burgundy focus:ring-4 focus:ring-elite-burgundy/20 transition-all duration-300 hover:border-elite-burgundy/40 touch-manipulation"
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 border-2 border-red-300 p-4 sm:p-5 animate-shake">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="font-cabin text-sm sm:text-base text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-elite-burgundy to-elite-dark-burgundy text-elite-cream font-cabin font-bold text-lg sm:text-xl py-5 sm:py-6 px-6 sm:px-8 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 touch-manipulation min-h-[56px]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6 text-elite-cream" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-lg">Sending Magic Link...</span>
                </>
              ) : (
                <>
                  <Mail className="w-6 h-6" />
                  <span>Send Magic Link</span>
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="bg-gradient-to-br from-elite-cream/40 to-elite-cream/20 border-2 border-elite-burgundy/10 rounded-2xl p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-elite-burgundy/10 rounded-full flex items-center justify-center">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-elite-burgundy" />
                </div>
              </div>
              <div className="font-cabin text-elite-black/70 text-sm sm:text-base leading-relaxed">
                <p className="font-semibold text-elite-burgundy mb-1">No password needed!</p>
                <p>We'll send you a secure link to sign in instantly. Just check your email and click the link. ☕</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
