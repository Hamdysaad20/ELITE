"use client";
import React from "react";
import {
  useDrinkSuggestion,
  type DrinkPreferences,
} from "@/hooks/useDrinkSuggestion";
import { useCart } from "@/hooks/useCart";
import { SuggestPreferencesForm } from "@/components/SuggestPreferencesForm";
import { RecommendationCard } from "@/components/RecommendationCard";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/Skeleton";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Sparkles, Coffee, ChevronRight } from "lucide-react";

export default function SuggestPage() {
  const { suggest, loading, error, result } = useDrinkSuggestion();
  const { addToCart } = useCart();
  const { push } = useToast();

  const handleSuggest = (prefs: DrinkPreferences) => {
    suggest(prefs);
  };

  return (
    <main className="page-transition loaded">
      <div className="min-h-screen bg-elite-cream">
        {/* Header */}
        <div className="bg-elite-burgundy text-elite-cream py-12">
          <div className="max-w-4xl mx-auto px-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm mb-4">
              <Link
                href="/menu"
                className="hover:text-elite-light-cream transition-colors duration-200"
              >
                Menu
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="font-semibold">AI Suggestion</span>
            </div>

            {/* Page Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-elite-cream/20 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h1 className="font-calistoga text-4xl md:text-5xl mb-2">
                  AI Drink Suggestion
                </h1>
                <p className="font-cabin text-elite-cream/90 text-lg">
                  Let our AI find your perfect drink based on your preferences
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-3xl shadow-xl border border-elite-burgundy/10 p-8 space-y-8">
            {/* Intro */}
            <div className="flex items-start gap-4 p-6 bg-elite-cream/50 rounded-2xl">
              <Coffee className="w-8 h-8 text-elite-burgundy flex-shrink-0 mt-1" />
              <div>
                <h2 className="font-calistoga text-elite-burgundy text-xl mb-2">
                  How it works
                </h2>
                <p className="font-cabin text-elite-black/80">
                  Tell us your preferences — temperature, caffeine level,
                  sweetness, and more — and our AI will suggest the perfect
                  drink for you. We&apos;ll also consider your past favorites to
                  personalize the recommendation.
                </p>
              </div>
            </div>

            {/* Form */}
            <SuggestPreferencesForm
              loading={loading}
              onSuggest={handleSuggest}
            />

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-cabin">
                {String(error)}
              </div>
            )}

            {/* Loading State */}
            {loading && !result && (
              <div className="space-y-6">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-elite-burgundy" />
                  <h2 className="font-calistoga text-elite-burgundy text-2xl">
                    Your Recommendations
                  </h2>
                </div>

                <RecommendationCard
                  title="Top Pick"
                  recommendation={result.recommendation}
                  primary
                  onAdd={async (item, size, flavor) => {
                    try {
                      await addToCart(item.id, 1, { size, flavor });
                      push({
                        type: "success",
                        message: `${item.name} added to cart`,
                      });
                    } catch {
                      push({ type: "error", message: "Failed to add item" });
                    }
                  }}
                />

                {result.alternatives?.length ? (
                  <>
                    <h3 className="font-calistoga text-elite-black text-lg mt-6">
                      You might also like
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {result.alternatives.map((alt, i) => (
                        <RecommendationCard
                          key={alt.item.id + i}
                          title={`Alternative ${i + 1}`}
                          recommendation={alt}
                          onAdd={async (item, size, flavor) => {
                            try {
                              await addToCart(item.id, 1, { size, flavor });
                              push({
                                type: "success",
                                message: `${item.name} added to cart`,
                              });
                            } catch {
                              push({
                                type: "error",
                                message: "Failed to add item",
                              });
                            }
                          }}
                        />
                      ))}
                    </div>
                  </>
                ) : null}

                {result.personalization?.favorites?.length ? (
                  <div className="p-4 bg-elite-cream/50 rounded-xl">
                    <p className="font-cabin text-sm text-elite-black/70">
                      <span className="font-semibold text-elite-burgundy">
                        Personalized for you:
                      </span>{" "}
                      Based on your favorites —{" "}
                      {result.personalization.favorites.join(", ")}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 font-cabin text-elite-burgundy hover:text-elite-dark-burgundy transition-colors"
            >
              <span>Or browse our full menu</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
