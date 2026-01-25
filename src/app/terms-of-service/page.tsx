"use client";

import Footer from "@/components/Footer";
import LocalizedLink from "@/components/LocalizedLink";
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
import { useTranslations } from "next-intl";

export default function TermsOfServicePage() {
  const updatedAt = "2026-01-23";
  const t = useTranslations("termsOfService");

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
                  {t("title")}
                </h1>
                <p className="font-cabin text-elite-cream/90 mt-2">
                  {t("updatedAt", { date: updatedAt })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10 sm:py-12">
          <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-6 sm:p-8 md:p-10 space-y-8">
            <p className="font-cabin text-elite-black/80 text-lg sm:text-xl leading-relaxed">
              {t("intro")}
            </p>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("business.title")}
              </h2>
              <div className="bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5 space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-elite-burgundy flex-shrink-0 mt-0.5" />
                  <p className="font-cabin text-elite-black/80">
                    {t("business.address")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-elite-burgundy" />
                  <p className="font-cabin text-elite-black/80">
                    {t("business.contactLabel")}{" "}
                    <span className="font-semibold">contact@officieleliteeg.com</span>
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("service.title")}
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                {t("service.description")}
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("eligibility.title")}
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                {t("eligibility.description")}
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("orders.title")}
              </h2>
              <div className="bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-elite-burgundy" />
                  <p className="font-calistoga text-elite-black">
                    {t("orders.cardTitle")}
                  </p>
                </div>
                <ul className="list-disc pl-6 font-cabin text-elite-black/80 space-y-2">
                  <li>
                    {t("orders.items.placed")}
                  </li>
                  <li>
                    {t("orders.items.provider")}
                  </li>
                  <li>
                    {t("orders.items.failed")}
                  </li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("menu.title")}
              </h2>
              <div className="flex items-start gap-3 bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <UtensilsCrossed className="w-6 h-6 text-elite-burgundy flex-shrink-0 mt-0.5" />
                <p className="font-cabin text-elite-black/80 leading-relaxed">
                  {t("menu.description")}
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("delivery.title")}
              </h2>
              <div className="flex items-start gap-3 bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <Truck className="w-6 h-6 text-elite-burgundy flex-shrink-0 mt-0.5" />
                <p className="font-cabin text-elite-black/80 leading-relaxed">
                  {t("delivery.description")}
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("returns.title")}
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                {t("returns.description")}
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("cancellations.title")}
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                {t("cancellations.description")}
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("liability.title")}
              </h2>
              <div className="flex items-start gap-3 bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <BadgeInfo className="w-6 h-6 text-elite-burgundy flex-shrink-0 mt-0.5" />
                <p className="font-cabin text-elite-black/80 leading-relaxed">
                  {t("liability.description")}
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("acceptable.title")}
              </h2>
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <AlertTriangle className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="font-cabin text-amber-900 leading-relaxed">
                  {t("acceptable.description")}
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("intellectual.title")}
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                {t("intellectual.description")}
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("governing.title")}
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                {t("governing.description")}
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("changes.title")}
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                {t("changes.description")}
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("contact.title")}
              </h2>
              <div className="bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-elite-burgundy" />
                  <p className="font-cabin text-elite-black/80 text-base sm:text-lg">
                    {t("contact.email")}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("privacy.title")}
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed">
                {t("privacy.description")}{" "}
                <LocalizedLink
                  href="/privacy-policy"
                  className="text-elite-burgundy underline font-semibold"
                >
                  {t("privacy.links.privacy")}
                </LocalizedLink>{" "}
                {t("privacy.and")}{" "}
                <LocalizedLink
                  href="/cookie-policy"
                  className="text-elite-burgundy underline font-semibold"
                >
                  {t("privacy.links.cookie")}
                </LocalizedLink>
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

