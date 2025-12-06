"use client";

import { useRequireAuth } from "@/lib/auth/hooks";
import { useLoyalty } from "@/hooks/useLoyalty";
import { LoyaltyCard, LoyaltyBenefits, LoyaltyActivity, LoyaltyTiers } from "@/components/LoyaltyCard";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Loader2, AlertCircle, RefreshCw, Gift } from "lucide-react";
import Link from "next/link";

export default function RewardsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { loyalty, loading, error, refetch } = useLoyalty();

  if (authLoading || loading) {
    return (
      <main>
        <Navigation />
        <div className="min-h-screen bg-elite-cream flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-elite-burgundy animate-spin mb-4" />
            <p className="text-elite-black/70 font-cabin text-lg">Loading your rewards...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main>
      <Navigation />
      <div className="min-h-screen bg-elite-cream">
        {/* Header */}
        <div className="bg-gradient-to-r from-elite-burgundy to-elite-dark-burgundy text-elite-cream py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-4">
              <Gift className="w-10 h-10" />
              <div>
                <h1 className="font-calistoga text-4xl md:text-5xl mb-2">
                  Rewards & Loyalty
                </h1>
                <p className="font-cabin text-elite-cream/90">
                  Earn points with every purchase and unlock exclusive benefits
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center mb-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-red-900 font-calistoga text-xl mb-2">Unable to Load Rewards</h3>
              <p className="text-red-700 font-cabin mb-4">{error}</p>
              <button
                onClick={refetch}
                className="inline-flex items-center gap-2 bg-elite-burgundy text-elite-cream px-6 py-3 rounded-full font-cabin font-semibold hover:bg-elite-dark-burgundy transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          )}

          {/* Loyalty Content */}
          {!error && loyalty && (
            <div className="space-y-8">
              {/* Loyalty Card */}
              <LoyaltyCard
                points={loyalty.account.points}
                level={loyalty.account.level}
                totalSpent={Number(loyalty.account.totalSpent)}
                progress={loyalty.tiers.progress}
                nextTier={loyalty.tiers.next}
              />

              {/* Grid Layout for Benefits and Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Benefits */}
                <LoyaltyBenefits
                  benefits={loyalty.tiers.current.benefits}
                  level={loyalty.account.level}
                />

                {/* Recent Activity */}
                <LoyaltyActivity activity={loyalty.recentActivity} />
              </div>

              {/* All Tiers */}
              <LoyaltyTiers
                tiers={loyalty.tiers.all}
                currentLevel={loyalty.account.level}
              />

              {/* How to Earn Points */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-200">
                <h3 className="text-2xl font-calistoga text-gray-900 mb-6 flex items-center gap-2">
                  <Gift className="w-6 h-6 text-elite-burgundy" />
                  How to Earn Points
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-white rounded-xl p-4 shadow-md mb-3">
                      <p className="text-3xl font-bold text-elite-burgundy font-calistoga">1</p>
                      <p className="text-sm text-gray-600 font-cabin">Point per</p>
                      <p className="text-lg font-semibold text-gray-900 font-cabin">10 EGP</p>
                    </div>
                    <p className="text-sm text-gray-700 font-cabin">
                      {loyalty.account.level === "silver" && "1.5 points "}
                      {loyalty.account.level === "gold" && "2 points "}
                      {loyalty.account.level === "platinum" && "3 points "}
                      {loyalty.account.level === "bronze" && "Earn with every purchase"}
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="bg-white rounded-xl p-4 shadow-md mb-3">
                      <p className="text-3xl font-bold text-elite-burgundy font-calistoga">2x</p>
                      <p className="text-sm text-gray-600 font-cabin">Points on</p>
                      <p className="text-lg font-semibold text-gray-900 font-cabin">Birthdays</p>
                    </div>
                    <p className="text-sm text-gray-700 font-cabin">
                      Double points on your special day
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="bg-white rounded-xl p-4 shadow-md mb-3">
                      <p className="text-3xl font-bold text-elite-burgundy font-calistoga">+50</p>
                      <p className="text-sm text-gray-600 font-cabin">Bonus for</p>
                      <p className="text-lg font-semibold text-gray-900 font-cabin">Referrals</p>
                    </div>
                    <p className="text-sm text-gray-700 font-cabin">
                      Invite friends and earn together
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-elite-burgundy to-elite-dark-burgundy text-elite-cream px-8 py-4 rounded-full font-cabin font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <Gift className="w-5 h-5" />
                  Start Earning Points
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
