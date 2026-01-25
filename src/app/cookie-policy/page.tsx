"use client";

import Footer from "@/components/Footer";
import { Cookie, Settings, Shield, Globe, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";

export default function CookiePolicyPage() {
  const updatedAt = "2026-01-23";
  const t = useTranslations("cookiePolicy");

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
                {t("types.title")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-elite-burgundy" />
                    <p className="font-calistoga text-elite-black">
                      {t("types.essential.title")}
                    </p>
                  </div>
                  <p className="font-cabin text-elite-black/75 text-sm leading-relaxed">
                    {t("types.essential.description")}
                  </p>
                </div>
                <div className="bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-5 h-5 text-elite-burgundy" />
                    <p className="font-calistoga text-elite-black">
                      {t("types.analytics.title")}
                    </p>
                  </div>
                  <p className="font-cabin text-elite-black/75 text-sm leading-relaxed">
                    {t("types.analytics.description")}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("session.title")}
              </h2>
              <div className="flex items-start gap-3 bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <Clock className="w-6 h-6 text-elite-burgundy flex-shrink-0 mt-0.5" />
                <p className="font-cabin text-elite-black/80 leading-relaxed">
                  {t("session.description")}
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("thirdParty.title")}
              </h2>
              <div className="flex items-start gap-3 bg-elite-cream/40 rounded-2xl border border-elite-burgundy/10 p-5">
                <Globe className="w-6 h-6 text-elite-burgundy flex-shrink-0 mt-0.5" />
                <p className="font-cabin text-elite-black/80 leading-relaxed">
                  {t("thirdParty.description")}
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("managing.title")}
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed">
                {t("managing.description")}
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("marketing.title")}
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                {t("marketing.description")}
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("doNotTrack.title")}
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed text-base sm:text-lg">
                {t("doNotTrack.description")}
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-calistoga text-elite-burgundy text-2xl">
                {t("related.title")}
              </h2>
              <p className="font-cabin text-elite-black/80 leading-relaxed">
                {t("related.description")}{" "}
                <LocalizedLink
                  href="/privacy-policy"
                  className="text-elite-burgundy underline font-semibold"
                >
                  {t("related.privacyLink")}
                </LocalizedLink>
                .
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
          </div>
        </div>

        <Footer />
      </div>
    </main>
  );
}

