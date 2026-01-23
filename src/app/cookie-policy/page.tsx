"use client";

import Footer from "@/components/Footer";
import Link from "next/link";
import { Cookie, Settings, Shield } from "lucide-react";

export default function CookiePolicyPage() {
  const updatedAt = "2026-01-23";

  return (
    <main className="page-transition loaded overflow-x-hidden">
      <div className="min-h-screen bg-elite-cream">
        <div className="bg-elite-burgundy text-elite-cream py-10 sm:py-14">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-elite-cream/20 rounded-3xl flex items-center justify-center shadow-lg">
                <Cookie className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h1 className="font-calistoga text-3xl sm:text-4xl md:text-5xl">
                  Cookie Policy
                </h1>
                <p className="font-cabin text-elite-cream/90 mt-2">
                  Last updated: {updatedAt}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10 sm:py-12">
          <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-6 sm:p-8 md:p-10 space-y-8">
            <p className="font-cabin text-elite-black/80 text-base sm:text-lg leading-relaxed">
              Cookies are small files stored on your device. We use them to keep
              the website working, improve performance, and support marketing
              and recommendations.
            </p>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Types of cookies we use
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-elite-burgundy" />
                    <p className="font-calistoga text-elite-black">Essential</p>
                  </div>
                  <p className="font-cabin text-elite-black/75 text-sm leading-relaxed">
                    Needed for core features like sign-in, security, and keeping
                    the site stable.
                  </p>
                </div>
                <div className="bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-5 h-5 text-elite-burgundy" />
                    <p className="font-calistoga text-elite-black">
                      Analytics & preferences
                    </p>
                  </div>
                  <p className="font-cabin text-elite-black/75 text-sm leading-relaxed">
                    Help us understand what’s working, fix issues, and remember
                    preferences (where available).
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Managing cookies
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed">
                You can control cookies in your browser settings (block, delete,
                or limit). Blocking essential cookies may prevent sign-in or
                checkout from working correctly.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Related policies
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed">
                For more details on how we use information, see our{" "}
                <Link
                  href="/privacy-policy"
                  className="text-elite-burgundy underline font-semibold"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </section>
          </div>
        </div>

        <Footer />
      </div>
    </main>
  );
}

