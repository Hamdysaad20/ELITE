"use client";

import { useState, FormEvent, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Coffee,
  Mail,
  ArrowLeft,
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

const EASE = [0.4, 0, 0.2, 1] as const;

function SignInContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const localizedRouter = useLocalizedRouter();
  const t = useTranslations("authSignIn");
  const locale = useLocale();
  const prefersReducedMotion = useReducedMotion();

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
      console.error("Sign in error:", err);
      setError(t("errors.generic"));
      setLoading(false);
    }
  };

  // ── Animation variants ────────────────────────────────────
  const fadeUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: EASE },
      };

  const cardFade = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, delay: 0.1, ease: EASE },
      };

  // y-axis only — RTL-safe (no directional x bias)
  const benefitContainer = prefersReducedMotion
    ? {}
    : {
        initial: "hidden",
        animate: "visible",
        variants: {
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.07, delayChildren: 0.2 },
          },
        },
      };

  const benefitItem = prefersReducedMotion
    ? {}
    : {
        variants: {
          hidden: { opacity: 0, y: 8 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3, ease: EASE },
          },
        },
      };

  // ── Shared form JSX ───────────────────────────────────────
  const formFields = (idSuffix: string) => (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div>
        <label
          htmlFor={`email-${idSuffix}`}
          className="block font-cabin font-semibold text-elite-black text-sm mb-2"
        >
          {t("form.emailLabel")}
        </label>
        <div className="relative">
          <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-elite-burgundy/50 pointer-events-none" />
          <input
            id={`email-${idSuffix}`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("form.emailPlaceholder")}
            disabled={loading}
            className="w-full ps-12 pe-5 py-4 bg-elite-cream/50 border-2 border-elite-burgundy/15 rounded-2xl font-cabin text-base text-elite-black placeholder-elite-black/30 focus:outline-none focus:border-elite-burgundy focus:bg-white focus:ring-4 focus:ring-elite-burgundy/10 transition-all touch-manipulation"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-red-500"
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
                <p className="font-cabin text-sm text-red-700">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={loading || !email}
        className="w-full bg-elite-burgundy text-elite-cream font-cabin font-bold text-base py-4 rounded-full shadow-md shadow-elite-burgundy/20 hover:shadow-lg hover:shadow-elite-burgundy/30 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2.5 touch-manipulation min-h-[56px]"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-elite-cream/30 border-t-elite-cream rounded-full animate-spin" />
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
  );

  return (
    <div className="min-h-screen bg-elite-cream">
      {/* ══════════════════════════════════════════════════════
          MOBILE LAYOUT  (hidden on lg+)
          Full burgundy background — floating form card
      ══════════════════════════════════════════════════════ */}
      <div
        className="lg:hidden min-h-screen bg-elite-burgundy flex flex-col overflow-hidden"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Ambient glow orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -end-20 w-64 h-64 bg-elite-cream/5 rounded-full blur-3xl" />
          <div className="absolute top-40 -start-16 w-48 h-48 bg-elite-cream/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 end-0 w-56 h-56 bg-elite-cream/5 rounded-full blur-3xl" />
        </div>

        {/* Back button */}
        <div className="relative z-10 flex items-center px-5 h-14 flex-shrink-0">
          <LocalizedLink
            href="/"
            className="inline-flex items-center gap-1.5 text-elite-cream/70 hover:text-elite-cream font-cabin text-sm touch-manipulation transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {t("actions.back")}
          </LocalizedLink>
        </div>

        {/* Brand mark */}
        <motion.div
          className="relative z-10 flex flex-col items-center text-center px-5 pt-2 pb-7"
          {...fadeUp}
        >
          {!prefersReducedMotion ? (
            <motion.div
              className="w-16 h-16 bg-elite-cream rounded-2xl flex items-center justify-center mb-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Coffee className="w-9 h-9 text-elite-burgundy" />
            </motion.div>
          ) : (
            <div className="w-16 h-16 bg-elite-cream rounded-2xl flex items-center justify-center mb-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
              <Coffee className="w-9 h-9 text-elite-burgundy" />
            </div>
          )}
          <h1 className="font-calistoga text-3xl text-elite-cream leading-tight mb-1">
            Elite Coffee
          </h1>
          <p className="font-cabin text-elite-cream/60 text-sm leading-relaxed max-w-[15rem]">
            {t("headline.subtitle")}
          </p>
        </motion.div>

        {/* Floating form card */}
        <motion.div
          className="relative z-10 mx-4 bg-white rounded-3xl shadow-[0_-4px_0px_rgba(255,255,255,0.1),0_20px_60px_rgba(0,0,0,0.25)] p-6 flex-shrink-0"
          {...cardFade}
        >
          <h2 className="font-calistoga text-2xl text-elite-black mb-1">
            {t("title")}
          </h2>
          <p className="font-cabin text-elite-black/50 text-sm mb-5">
            {t("subtitle")}
          </p>

          {formFields("mobile")}

          <p className="mt-3 font-cabin text-xs text-elite-black/40 text-center leading-relaxed">
            {t("mobile.magicLinkDescription")}
          </p>

          {/* Benefit chips */}
          <div className="mt-5 pt-4 border-t border-elite-burgundy/10">
            <motion.div className="flex flex-wrap gap-2" {...benefitContainer}>
              {benefits.slice(0, 3).map((benefit) => (
                <motion.div
                  key={benefit.title}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-elite-cream rounded-full"
                  {...benefitItem}
                >
                  <benefit.icon className="w-3 h-3 text-elite-burgundy flex-shrink-0" />
                  <span className="font-cabin text-xs text-elite-black/70">
                    {benefit.title}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Safe-area spacer */}
        <div
          className="flex-1 min-h-[1.5rem]"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════
          DESKTOP LAYOUT  (hidden below lg)
          Left panel (benefits) + Right panel (form)
      ══════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex min-h-screen">
        {/* Left: burgundy panel */}
        <div className="lg:w-[44%] bg-elite-burgundy relative overflow-hidden flex flex-col">
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 start-8 w-60 h-60 bg-elite-cream/5 rounded-full blur-3xl" />
            <div className="absolute bottom-32 end-8 w-72 h-72 bg-elite-cream/5 rounded-full blur-3xl" />
          </div>

          {/* Floating beans */}
          {!prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              animate={{ y: [0, -14, 0], rotate: [0, 0.6, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/images/coffee-beans-floating.png"
                alt=""
                fill
                className="object-cover object-center"
                quality={75}
                priority
              />
            </motion.div>
          )}

          {/* Panel content */}
          <div className="relative z-10 flex flex-col h-full px-12 xl:px-16 py-12">
            {/* Logo */}
            <LocalizedLink
              href="/"
              className="flex items-center gap-3 mb-12 group w-fit"
            >
              <div className="w-12 h-12 bg-elite-cream rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Coffee className="w-7 h-7 text-elite-burgundy" />
              </div>
              <span className="font-calistoga text-2xl text-elite-cream">
                Elite
              </span>
            </LocalizedLink>

            {/* Headline */}
            <div className="mb-10">
              <h1 className="font-calistoga text-4xl xl:text-[2.75rem] text-elite-cream leading-tight mb-3">
                {t("headline.titleLine1")}
                <br />
                <span className="text-elite-cream/70">
                  {t("headline.titleLine2")}
                </span>
              </h1>
              <p className="font-cabin text-elite-cream/60 text-base leading-relaxed max-w-xs">
                {t("headline.subtitle")}
              </p>
            </div>

            {/* Benefits — staggered entrance */}
            <motion.div className="space-y-5 flex-1" {...benefitContainer}>
              {benefits.map((benefit) => (
                <motion.div
                  key={benefit.title}
                  className="flex items-start gap-4"
                  {...benefitItem}
                >
                  <div className="w-10 h-10 bg-elite-cream/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-elite-cream" />
                  </div>
                  <div>
                    <p className="font-cabin font-bold text-elite-cream text-sm mb-0.5">
                      {benefit.title}
                    </p>
                    <p className="font-cabin text-elite-cream/50 text-xs leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Footer */}
            <div className="mt-10 pt-8 border-t border-elite-cream/10">
              <p className="font-cabin text-elite-cream/40 text-xs">
                {t("trust.customers")}
              </p>
            </div>
          </div>
        </div>

        {/* Right: form panel */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center px-12 xl:px-20 py-12">
            <motion.div
              className="w-full max-w-md"
              initial={prefersReducedMotion ? false : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: EASE }}
            >
              {/* Back link */}
              <LocalizedLink
                href="/"
                className="inline-flex items-center gap-2 text-elite-black/50 hover:text-elite-burgundy transition-colors mb-10 font-cabin text-sm group touch-manipulation"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5 transition-transform" />
                {t("actions.backToHome")}
              </LocalizedLink>

              {/* Heading */}
              <div className="mb-7">
                <h2 className="font-calistoga text-4xl xl:text-5xl text-elite-black mb-2">
                  {t("title")}
                </h2>
                <p className="font-cabin text-elite-black/60 text-base">
                  {t("subtitle")}
                </p>
              </div>

              {/* Passwordless badge */}
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2.5 bg-elite-cream rounded-2xl border border-elite-burgundy/15 shadow-sm">
                <Sparkles className="w-4 h-4 text-elite-burgundy flex-shrink-0" />
                <span className="font-cabin text-sm font-semibold text-elite-burgundy">
                  {t("mobile.noPassword")}
                </span>
              </div>

              {/* Form */}
              {formFields("desktop")}

              {/* Explanation */}
              <p className="mt-4 font-cabin text-xs text-elite-black/40 text-center leading-relaxed">
                {t("mobile.magicLinkDescription")}
              </p>
            </motion.div>
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
          <div className="h-12 w-12 border-4 border-elite-burgundy border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
