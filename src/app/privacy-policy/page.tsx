"use client";

import Footer from "@/components/Footer";
import Link from "next/link";
import {
  Shield,
  Mail,
  MapPin,
  Cookie,
  CreditCard,
  Lock,
  Megaphone,
  Clock,
  UserRound,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  const updatedAt = "2026-01-23";

  return (
    <main className="page-transition loaded overflow-x-hidden">
      <div className="min-h-screen bg-elite-cream">
        {/* Header */}
        <div className="bg-elite-burgundy text-elite-cream py-10 sm:py-14">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-elite-cream/20 rounded-3xl flex items-center justify-center shadow-lg">
                <Shield className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h1 className="font-calistoga text-3xl sm:text-4xl md:text-5xl">
                  Privacy Policy
                </h1>
                <p className="font-cabin text-elite-cream/90 mt-2">
                  Last updated: {updatedAt}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-6 py-10 sm:py-12">
          <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-6 sm:p-8 md:p-10 space-y-8">
            <p className="font-cabin text-elite-black/80 text-lg sm:text-xl leading-relaxed">
              This Privacy Policy explains how <strong>Elite Coffee</strong>{" "}
              (“we”, “us”) collects and uses information when you use our
              website and ordering experience in Egypt.
            </p>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Who we are
              </h2>
              <div className="bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <UserRound className="w-5 h-5 text-elite-burgundy" />
                  <p className="font-cabin text-elite-black/80">
                    <strong>Elite Coffee</strong> is a café in Egypt that sells
                    coffee, desserts, and breakfast items.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-elite-burgundy flex-shrink-0 mt-0.5" />
                  <p className="font-cabin text-elite-black/80">
                    Faiyum, Governorate Club, next to the Governor&apos;s Villa
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Definitions
              </h2>
              <ul className="list-disc pl-6 font-cabin text-elite-black/80 space-y-2 text-base sm:text-lg">
                <li>
                  <strong>“Account”</strong>: a profile created using your email.
                </li>
                <li>
                  <strong>“Order”</strong>: a request for coffee, desserts, or
                  breakfast items through our website.
                </li>
                <li>
                  <strong>“Personal data”</strong>: information that identifies
                  you directly or indirectly (e.g., phone, address, order
                  history).
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                What we collect
              </h2>
              <ul className="list-disc pl-6 font-cabin text-elite-black/80 space-y-2 text-base sm:text-lg">
                <li>
                  <strong>Account info</strong>: email, name (if provided).
                </li>
                <li>
                  <strong>Order info</strong>: items (coffee, dessert, breakfast),
                  customizations, notes, totals.
                </li>
                <li>
                  <strong>Delivery details</strong>: address and phone number (for
                  delivery and online payment billing requirements).
                </li>
                <li>
                  <strong>Device/usage</strong>: basic technical data and pages
                  you interact with (for security and performance).
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Why we use it
              </h2>
              <ul className="list-disc pl-6 font-cabin text-elite-black/80 space-y-2 text-base sm:text-lg">
                <li>
                  <strong>To process your order</strong> and provide customer
                  support.
                </li>
                <li>
                  <strong>To enable online payments</strong> and prevent fraud.
                </li>
                <li>
                  <strong>To improve recommendations</strong> and personalize
                  the experience (marketing and better suggestions).
                </li>
                <li>
                  <strong>To improve the service</strong> (analytics, debugging,
                  performance).
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Legal basis (general)
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                We process information to perform our services (processing
                orders), to comply with legal obligations where applicable, and
                for legitimate business interests such as security, preventing
                fraud, improving performance, and improving customer experience.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Payments & third parties
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-elite-burgundy" />
                    <p className="font-calistoga text-elite-black">
                      Payment processing
                    </p>
                  </div>
                  <p className="font-cabin text-elite-black/75 text-sm leading-relaxed">
                    Online payments are processed by our payment provider (e.g.
                    Paymob). We don’t store your full card details on our
                    servers.
                  </p>
                </div>
                <div className="bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-elite-burgundy" />
                    <p className="font-calistoga text-elite-black">
                      Delivery partners
                    </p>
                  </div>
                  <p className="font-cabin text-elite-black/75 text-sm leading-relaxed">
                    If delivery is fulfilled by third parties, we share only the
                    information needed to deliver your order (name, phone,
                    address, order contents).
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Marketing & recommendations
              </h2>
              <div className="flex items-start gap-3 bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <Megaphone className="w-6 h-6 text-elite-burgundy flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-cabin text-elite-black/80 leading-relaxed">
                    We may use purchase history and on-site interactions to
                    improve menu recommendations and marketing (e.g., suggesting
                    items you may like).
                  </p>
                  <p className="font-cabin text-elite-black/70 text-sm leading-relaxed">
                    You can opt out of marketing messages by following the
                    unsubscribe instructions (when available) or by contacting
                    us.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Cookies
              </h2>
              <div className="flex items-start gap-3 bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <Cookie className="w-6 h-6 text-elite-burgundy flex-shrink-0 mt-0.5" />
                <p className="font-cabin text-elite-black/80 leading-relaxed">
                  We use cookies and similar technologies to keep you signed in,
                  remember preferences, and measure performance. See our{" "}
                  <Link
                    href="/cookie-policy"
                    className="text-elite-burgundy underline font-semibold"
                  >
                    Cookie Policy
                  </Link>
                  .
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Data retention
              </h2>
              <div className="flex items-start gap-3 bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <Clock className="w-6 h-6 text-elite-burgundy flex-shrink-0 mt-0.5" />
                <p className="font-cabin text-elite-black/80 leading-relaxed">
                  We keep information only as long as needed for operations,
                  support, security, accounting, and legal compliance, then
                  delete or anonymize it where possible.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Security
              </h2>
              <div className="flex items-start gap-3 bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <Lock className="w-6 h-6 text-elite-burgundy flex-shrink-0 mt-0.5" />
                <p className="font-cabin text-elite-black/80 leading-relaxed">
                  We use reasonable technical and organizational measures to
                  protect information. No system is 100% secure; please keep
                  your account access secure.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Children’s privacy
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                Our ordering service is intended for general audiences. If you
                believe a child has provided personal data through our site,
                contact us and we will take appropriate steps.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Your choices
              </h2>
              <ul className="list-disc pl-6 font-cabin text-elite-black/80 space-y-2 text-base sm:text-lg">
                <li>
                  You can update delivery addresses and phone numbers in your
                  account settings.
                </li>
                <li>
                  You can choose whether to accept cookies in your browser
                  settings.
                </li>
                <li>
                  You can contact us to request access/correction of your
                  information.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Changes to this policy
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                We may update this policy from time to time to reflect changes
                in our practices or services. We will update the “Last updated”
                date on this page.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                Contact
              </h2>
              <div className="bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-elite-burgundy" />
                  <p className="font-cabin text-elite-black/80">
                    For privacy requests, contact us at{" "}
                    <span className="font-semibold">contact@officieleliteeg.com</span>
                    .
                  </p>
                </div>
                <p className="font-cabin text-elite-black/60 text-sm">
                  This policy is provided for transparency and operational
                  clarity. If you need formal legal advice for Egypt, consult a
                  qualified lawyer.
                </p>
              </div>
            </section>
          </div>
        </div>

        <Footer />
      </div>
    </main>
  );
}

