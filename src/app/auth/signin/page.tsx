"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Coffee,
  Mail,
  ArrowLeft,
  Info,
  Sparkles,
  Gift,
  Zap,
  Star,
  Award,
  Heart,
  Check,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";
import { addLocaleToPathname } from "@/i18n/routing";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";
import { cn } from "@/lib/utils";

function SignInContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const searchParams = useSearchParams();
  const localizedRouter = useLocalizedRouter();
  const t = useTranslations("authSignIn");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const rawCallbackUrl = searchParams?.get("callbackUrl");
  const callbackUrl = rawCallbackUrl
    ? addLocaleToPathname(rawCallbackUrl, locale)
    : addLocaleToPathname("/", locale);
  const benefits = [
    {
      icon: Gift,
      title: t("benefits.earnPoints.title"),
      description: t("benefits.earnPoints.description"),
    },
    {
      icon: Zap,
      title: t("benefits.fasterCheckout.title"),
      description: t("benefits.fasterCheckout.description"),
    },
    {
      icon: Star,
      title: t("benefits.exclusiveDeals.title"),
      description: t("benefits.exclusiveDeals.description"),
    },
    {
      icon: Award,
      title: t("benefits.vipTiers.title"),
      description: t("benefits.vipTiers.description"),
    },
    {
      icon: Heart,
      title: t("benefits.saveFavorites.title"),
      description: t("benefits.saveFavorites.description"),
    },
  ];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("email", {
        email,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else if (result?.ok) {
        localizedRouter.push(
          `/auth/verify-request?email=${encodeURIComponent(email)}`,
        );
      } else {
        setError(t("errors.sendLink"));
        setLoading(false);
      }
    } catch (err) {
      console.error("Sign in exception:", err);
      setError(t("errors.generic"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-elite-cream flex">
      {/* Desktop Left Panel - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] bg-elite-burgundy relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-elite-cream/5 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-10 w-80 h-80 bg-elite-cream/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-elite-cream/3 rounded-full blur-[100px]" />

          {/* Floating Coffee Beans */}
          <motion.div
            className="absolute inset-0 z-0 opacity-10 pointer-events-none"
            animate={{
              y: [0, -15, 0],
              rotate: [0, 1, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Image
              src="/images/coffee-beans-floating.png"
              alt=""
              fill
              className="object-cover object-center"
              quality={90}
              priority
            />
          </motion.div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 py-12 w-full">
          {/* Logo */}
          <LocalizedLink
            href="/"
            className="flex items-center gap-3 mb-12 group"
          >
            <div className="w-14 h-14 bg-elite-cream rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Coffee className="w-8 h-8 text-elite-burgundy" />
            </div>
            <span className="font-calistoga text-3xl text-elite-cream">
              Elite
            </span>
          </LocalizedLink>

          {/* Headline */}
          <div className="mb-12">
            <h1 className="font-calistoga text-4xl xl:text-5xl text-elite-cream leading-tight mb-4">
              {t("headline.titleLine1")}
              <br />
              <span className="text-elite-cream/80">
                {t("headline.titleLine2")}
              </span>
            </h1>
            <p className="font-cabin text-elite-cream/70 text-lg xl:text-xl max-w-md">
              {t("headline.subtitle")}
            </p>
          </div>

          {/* Benefits List */}
          <div className="space-y-5">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="flex items-start gap-4 group"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="w-12 h-12 bg-elite-cream/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-elite-cream/20 transition-colors">
                  <benefit.icon className="w-6 h-6 text-elite-cream" />
                </div>
                <div>
                  <h3 className="font-cabin font-bold text-elite-cream text-lg mb-0.5">
                    {benefit.title}
                  </h3>
                  <p className="font-cabin text-elite-cream/60 text-sm">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-auto pt-12 border-t border-elite-cream/10">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-elite-cream/20 border-2 border-elite-burgundy flex items-center justify-center"
                    >
                      <span className="text-xs text-elite-cream font-bold">
                        {i}
                      </span>
                    </div>
                  ))}
                </div>
                <span className="font-cabin text-elite-cream/70 text-sm ml-2">
                  {t("trust.customers")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-elite-burgundy px-5 pt-6 pb-10 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-elite-cream/5 rounded-full blur-2xl" />
          </div>

          <div className="relative z-10">
            <LocalizedLink
              href="/"
              className="inline-flex items-center gap-2 text-elite-cream/80 hover:text-elite-cream active:scale-95 transition-all mb-6 font-cabin text-sm touch-manipulation"
            >
              <ArrowLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
              <span>{t("actions.back")}</span>
            </LocalizedLink>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-elite-cream rounded-2xl flex items-center justify-center shadow-lg">
                <Coffee className="w-7 h-7 text-elite-burgundy" />
              </div>
              <div>
                <h1 className="font-calistoga text-2xl text-elite-cream">
                  {t("mobile.welcomeTitle")}
                </h1>
                <p className="font-cabin text-elite-cream/70 text-sm">
                  {t("mobile.welcomeSubtitle")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-5 py-8 lg:py-12 lg:px-12 xl:px-20">
          <div className="w-full max-w-md">
            {/* Desktop Back Link */}
            <LocalizedLink
              href="/"
              className="hidden lg:inline-flex items-center gap-2 text-elite-burgundy/70 hover:text-elite-burgundy active:scale-95 transition-all mb-8 font-cabin text-base group touch-manipulation"
            >
              <ArrowLeft
                className={cn(
                  "w-5 h-5 transition-transform",
                  isRTL
                    ? "rotate-180 group-hover:translate-x-1"
                    : "group-hover:-translate-x-1",
                )}
              />
              <span className="font-medium">{t("actions.backToHome")}</span>
            </LocalizedLink>

            {/* Desktop Header */}
            <div className="hidden lg:block mb-10">
              <h1 className="font-calistoga text-4xl xl:text-5xl text-elite-black mb-3">
                {t("title")}
              </h1>
              <p className="font-cabin text-elite-black/60 text-lg">
                {t("subtitle")}
              </p>
            </div>

            {/* Mobile Title */}
            <div className="lg:hidden mb-8 -mt-5 bg-white rounded-3xl shadow-lg p-6 border border-elite-burgundy/10">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-elite-burgundy" />
                <span className="font-cabin font-bold text-elite-burgundy text-sm">
                  {t("mobile.noPassword")}
                </span>
              </div>
              <p className="font-cabin text-elite-black/70 text-sm leading-relaxed">
                {t("mobile.magicLinkDescription")}
              </p>
            </div>

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="email"
                    className="block font-cabin font-bold text-elite-black text-base"
                  >
                    {t("form.emailLabel")}
                  </label>
                  <button
                    type="button"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={() => setShowTooltip(!showTooltip)}
                    className="text-elite-burgundy/50 hover:text-elite-burgundy transition-colors p-1 -m-1 hidden lg:block"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  {showTooltip && (
                    <div className="hidden lg:block absolute right-0 top-full mt-2 w-72 bg-elite-burgundy text-elite-cream text-sm p-4 rounded-2xl shadow-2xl z-20 font-cabin">
                      {t("form.tooltip")}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-elite-burgundy/40" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-white border-2 border-elite-burgundy/15 rounded-2xl font-cabin text-base text-elite-black placeholder-elite-black/35 focus:outline-none focus:border-elite-burgundy focus:ring-4 focus:ring-elite-burgundy/10 transition-all hover:border-elite-burgundy/30 touch-manipulation"
                    placeholder={t("form.emailPlaceholder")}
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-4 animate-shake">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg
                        className="h-5 w-5 text-red-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="font-cabin text-sm text-red-700 font-medium">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-elite-burgundy text-elite-cream font-cabin font-bold text-base py-4.5 rounded-full shadow-lg shadow-elite-burgundy/25 hover:shadow-xl hover:shadow-elite-burgundy/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2.5 touch-manipulation min-h-[56px]"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-elite-cream"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>{t("actions.sending")}</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>{t("actions.send")}</span>
                  </>
                )}
              </button>
            </form>

            {/* Desktop Info Box */}
            <div className="hidden lg:block mt-8 bg-elite-cream/50 border border-elite-burgundy/10 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-elite-burgundy/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-elite-burgundy" />
                </div>
                <div className="font-cabin text-elite-black/70 text-sm leading-relaxed">
                  <p className="font-semibold text-elite-burgundy mb-1">
                    {t("desktop.passwordlessTitle")}
                  </p>
                  <p>
                    {t("desktop.passwordlessDescription")}
                  </p>
                </div>
              </div>
            </div>

            {/* Features for mobile */}
            <div className="lg:hidden mt-8 pt-6 border-t border-elite-burgundy/10">
              <h3 className="font-cabin font-bold text-elite-black text-sm mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-elite-burgundy" />
                {t("mobile.benefitsTitle")}
              </h3>
              <div className="space-y-3">
                {benefits.slice(0, 3).map((benefit) => (
                  <div key={benefit.title} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="font-cabin text-elite-black/70 text-sm">
                      {benefit.title}
                    </span>
                  </div>
                ))}
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-elite-cream flex items-center justify-center">
          <div className="w-12 h-12 border-3 border-elite-burgundy border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
