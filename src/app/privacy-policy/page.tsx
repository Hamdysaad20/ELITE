"use client";

import Footer from "@/components/Footer";
import LocalizedLink from "@/components/LocalizedLink";
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
import { useTranslations } from "next-intl";

export default function PrivacyPolicyPage() {
  const updatedAt = "2026-01-23";
  const t = useTranslations("privacyPolicy");

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
                  {t("title")}
                </h1>
                <p className="font-cabin text-elite-cream/90 mt-2">
                  {t("updatedAt", { date: updatedAt })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-6 py-10 sm:py-12">
          <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 p-6 sm:p-8 md:p-10 space-y-8">
            <p className="font-cabin text-elite-black/80 text-lg sm:text-xl leading-relaxed">
              {t("intro")}
            </p>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("whoWeAre.title")}
              </h2>
              <div className="bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <UserRound className="w-5 h-5 text-elite-burgundy" />
                  <p className="font-cabin text-elite-black/80">
                    {t("whoWeAre.description")}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-elite-burgundy flex-shrink-0 mt-0.5" />
                  <p className="font-cabin text-elite-black/80">
                    {t("whoWeAre.address")}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("definitions.title")}
              </h2>
              <ul className="list-disc pl-6 font-cabin text-elite-black/80 space-y-2 text-base sm:text-lg">
                <li>
                  <strong>{t("definitions.account.label")}</strong>:{" "}
                  {t("definitions.account.description")}
                </li>
                <li>
                  <strong>{t("definitions.order.label")}</strong>:{" "}
                  {t("definitions.order.description")}
                </li>
                <li>
                  <strong>{t("definitions.personalData.label")}</strong>:{" "}
                  {t("definitions.personalData.description")}
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("collect.title")}
              </h2>
              <ul className="list-disc pl-6 font-cabin text-elite-black/80 space-y-2 text-base sm:text-lg">
                <li>
                  <strong>{t("collect.accountInfo.label")}</strong>:{" "}
                  {t("collect.accountInfo.description")}
                </li>
                <li>
                  <strong>{t("collect.orderInfo.label")}</strong>:{" "}
                  {t("collect.orderInfo.description")}
                </li>
                <li>
                  <strong>{t("collect.deliveryDetails.label")}</strong>:{" "}
                  {t("collect.deliveryDetails.description")}
                </li>
                <li>
                  <strong>{t("collect.deviceUsage.label")}</strong>:{" "}
                  {t("collect.deviceUsage.description")}
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("use.title")}
              </h2>
              <ul className="list-disc pl-6 font-cabin text-elite-black/80 space-y-2 text-base sm:text-lg">
                <li>
                  <strong>{t("use.processOrder.label")}</strong>{" "}
                  {t("use.processOrder.description")}
                </li>
                <li>
                  <strong>{t("use.onlinePayments.label")}</strong>{" "}
                  {t("use.onlinePayments.description")}
                </li>
                <li>
                  <strong>{t("use.recommendations.label")}</strong>{" "}
                  {t("use.recommendations.description")}
                </li>
                <li>
                  <strong>{t("use.improveService.label")}</strong>{" "}
                  {t("use.improveService.description")}
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("legal.title")}
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                {t("legal.description")}
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("payments.title")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-elite-burgundy" />
                    <p className="font-calistoga text-elite-black">
                      {t("payments.processing.title")}
                    </p>
                  </div>
                  <p className="font-cabin text-elite-black/75 text-sm leading-relaxed">
                    {t("payments.processing.description")}
                  </p>
                </div>
                <div className="bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-elite-burgundy" />
                    <p className="font-calistoga text-elite-black">
                      {t("payments.delivery.title")}
                    </p>
                  </div>
                  <p className="font-cabin text-elite-black/75 text-sm leading-relaxed">
                    {t("payments.delivery.description")}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("marketing.title")}
              </h2>
              <div className="flex items-start gap-3 bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <Megaphone className="w-6 h-6 text-elite-burgundy flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-cabin text-elite-black/80 leading-relaxed">
                    {t("marketing.description")}
                  </p>
                  <p className="font-cabin text-elite-black/70 text-sm leading-relaxed">
                    {t("marketing.optOut")}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("cookies.title")}
              </h2>
              <div className="flex items-start gap-3 bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <Cookie className="w-6 h-6 text-elite-burgundy flex-shrink-0 mt-0.5" />
                <p className="font-cabin text-elite-black/80 leading-relaxed">
                  {t("cookies.description")}{" "}
                  <LocalizedLink
                    href="/cookie-policy"
                    className="text-elite-burgundy underline font-semibold"
                  >
                    {t("cookies.link")}
                  </LocalizedLink>
                  .
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("retention.title")}
              </h2>
              <div className="flex items-start gap-3 bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <Clock className="w-6 h-6 text-elite-burgundy flex-shrink-0 mt-0.5" />
                <p className="font-cabin text-elite-black/80 leading-relaxed">
                  {t("retention.description")}
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("security.title")}
              </h2>
              <div className="flex items-start gap-3 bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <Lock className="w-6 h-6 text-elite-burgundy flex-shrink-0 mt-0.5" />
                <p className="font-cabin text-elite-black/80 leading-relaxed">
                  {t("security.description")}
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("children.title")}
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                {t("children.description")}
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("choices.title")}
              </h2>
              <ul className="list-disc pl-6 font-cabin text-elite-black/80 space-y-2 text-base sm:text-lg">
                <li>
                  {t("choices.updateAddresses")}
                </li>
                <li>
                  {t("choices.manageCookies")}
                </li>
                <li>
                  {t("choices.accessRequest")}
                </li>
              </ul>
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
              <div className="bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-elite-burgundy" />
                  <p className="font-cabin text-elite-black/80">
                    {t("contact.request")}{" "}
                    <span className="font-semibold">contact@officieleliteeg.com</span>
                    .
                  </p>
                </div>
                <p className="font-cabin text-elite-black/60 text-sm">
                  {t("contact.disclaimer")}
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

