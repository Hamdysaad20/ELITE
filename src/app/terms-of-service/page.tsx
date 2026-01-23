"use client";

import Footer from "@/components/Footer";
import Link from "next/link";
import {
  FileText,
  CreditCard,
  Truck,
  AlertTriangle,
  BadgeInfo,
  UtensilsCrossed,
  MapPin,
  Mail,
} from "lucide-react";

export default function TermsOfServicePage() {
  const updatedAt = "2026-01-23";

  return (
    <main className="page-transition loaded overflow-x-hidden">
      <div className="min-h-screen bg-elite-cream">
        <div className="bg-elite-burgundy text-elite-cream py-10 sm:py-14">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-elite-cream/20 rounded-3xl flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h1 className="font-calistoga text-3xl sm:text-4xl md:text-5xl">
                  Terms of Service
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
            <p className="font-cabin text-elite-black/80 text-lg sm:text-xl leading-relaxed">
              These Terms apply to using our website and ordering service in
              Egypt. By using the site, you agree to these Terms.
            </p>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Business details
              </h2>
              <div className="bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5 space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-elite-burgundy flex-shrink-0 mt-0.5" />
                  <p className="font-cabin text-elite-black/80">
                    Faiyum, Governorate Club, next to the Governor&apos;s Villa
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-elite-burgundy" />
                  <p className="font-cabin text-elite-black/80">
                    Contact:{" "}
                    <span className="font-semibold">
                      contact@officieleliteeg.com
                    </span>
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Our service
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                We are a café that sells coffee, desserts, and breakfast items.
                Availability and prices may change without notice.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Eligibility & accounts
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                You are responsible for the accuracy of information you provide
                (especially phone number and delivery address) and for keeping
                access to your account secure.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Orders & payment (online only)
              </h2>
              <div className="bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-elite-burgundy" />
                  <p className="font-calistoga text-elite-black">
                    Payment required to place an order
                  </p>
                </div>
                <ul className="list-disc pl-6 font-cabin text-elite-black/80 space-y-2">
                  <li>
                    Orders are considered <strong>placed</strong> only after
                    successful online payment confirmation.
                  </li>
                  <li>
                    Payments are processed by our payment provider (e.g. Paymob).
                  </li>
                  <li>
                    If payment fails or is cancelled, the order won’t be
                    confirmed.
                  </li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Menu details & allergens
              </h2>
              <div className="flex items-start gap-3 bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <UtensilsCrossed className="w-6 h-6 text-elite-burgundy flex-shrink-0 mt-0.5" />
                <p className="font-cabin text-elite-black/80 leading-relaxed">
                  Ingredient and allergen information can vary. If you have
                  allergies, please contact us before ordering and add notes at
                  checkout where available.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Delivery
              </h2>
              <div className="flex items-start gap-3 bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <Truck className="w-6 h-6 text-elite-burgundy flex-shrink-0 mt-0.5" />
                <p className="font-cabin text-elite-black/80 leading-relaxed">
                  Delivery may be fulfilled by third‑party delivery partners.
                  Delivery times are estimates and can vary due to traffic,
                  weather, and partner capacity.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Returns, refunds, and issues
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                If there’s an issue with your order, please contact us as soon
                as possible. Refunds (if applicable) may be handled through the
                original payment method and subject to provider processing
                timelines.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Cancellations
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                Because we prepare food and drinks quickly, cancellation may not
                be possible after an order is confirmed/accepted for
                preparation. If you need help, contact us immediately.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Limitation of liability
              </h2>
              <div className="flex items-start gap-3 bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <BadgeInfo className="w-6 h-6 text-elite-burgundy flex-shrink-0 mt-0.5" />
                <p className="font-cabin text-elite-black/80 leading-relaxed">
                  To the extent allowed by applicable law, we are not liable for
                  indirect or consequential damages. Our responsibility for any
                  claim related to an order is limited to the amount paid for
                  that order.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Acceptable use
              </h2>
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <AlertTriangle className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="font-cabin text-amber-900 leading-relaxed">
                  Don’t misuse the site (fraud, abuse, automated scraping, or
                  interfering with normal operation). We may suspend access if
                  needed for security.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Intellectual property
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                Our brand, logos, and site content are owned by Elite Coffee or
                licensed to us. You may not copy or reuse them without
                permission.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Governing law (Egypt)
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                These Terms are intended to be interpreted under the laws and
                regulations applicable in Egypt. If a dispute arises, we prefer
                to resolve it amicably first—please contact us.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Changes to these terms
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                We may update these Terms from time to time. We will update the
                “Last updated” date on this page.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Contact
              </h2>
              <div className="bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-elite-burgundy" />
                  <p className="font-cabin text-elite-black/80 text-base sm:text-lg">
                    contact@officieleliteeg.com
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Privacy & cookies
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed">
                See our{" "}
                <Link
                  href="/privacy-policy"
                  className="text-elite-burgundy underline font-semibold"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/cookie-policy"
                  className="text-elite-burgundy underline font-semibold"
                >
                  Cookie Policy
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

