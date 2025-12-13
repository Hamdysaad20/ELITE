"use client";

import { useState } from "react";
import { useRequireAuth } from "@/lib/auth/hooks";
import { usePointsHistory } from "@/hooks/useAnalytics";
import MobileHeader from "@/components/MobileHeader";
import SwipeIndicator from "@/components/SwipeIndicator";
import Footer from "@/components/Footer";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { Loader2, Award, TrendingUp, TrendingDown, Clock, Gift } from "lucide-react";

export default function PointsHistoryPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { transactions, loading, error } = usePointsHistory(50);
  const { swipeProgress, isSwipingBack } = useSwipeBack({ enabled: true });

  if (authLoading || loading) {
    return (
      <>
        <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
        <MobileHeader title="Points History" showBack={true} />
        <main className="min-h-screen bg-elite-cream flex items-center justify-center pt-16 md:pt-0">
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-elite-burgundy animate-spin mb-4" />
            <p className="text-elite-black/70 font-cabin text-lg">Loading history...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
        <MobileHeader title="Points History" showBack={true} />
        <main className="min-h-screen bg-elite-cream pt-16 md:pt-0 pb-32">
          <div className="max-w-3xl mx-auto px-4 pt-8">
            <div className="bg-white rounded-3xl p-8 text-center">
              <p className="text-elite-black/70 font-cabin">Failed to load history</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earn':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'redeem':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'expire':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'adjust':
        return <Gift className="w-5 h-5 text-blue-600" />;
      default:
        return <Award className="w-5 h-5 text-elite-burgundy" />;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
      <MobileHeader title="Points History" showBack={true} />
      
      <main className="min-h-screen bg-elite-cream pb-32 md:pb-8 pt-16 md:pt-0">
        <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 md:pt-8 space-y-4">
          
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-6">
            <h1 className="font-calistoga text-2xl text-elite-black mb-2">
              Points History
            </h1>
            <p className="font-cabin text-elite-black/60">
              Your complete transaction history
            </p>
          </div>

          {/* Transactions List */}
          {transactions.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-8 text-center">
              <Award className="w-16 h-16 text-elite-burgundy/30 mx-auto mb-4" />
              <h3 className="font-calistoga text-xl text-elite-black mb-2">
                No History Yet
              </h3>
              <p className="font-cabin text-elite-black/60">
                Start earning points by placing orders!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction: { id: string; type: string; amount: number; reason: string; createdAt: Date | string; balance: number }) => (
                <div
                  key={transaction.id}
                  className="bg-white rounded-2xl shadow-sm border-2 border-elite-burgundy/10 p-4 hover:border-elite-burgundy/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 p-2 bg-elite-cream rounded-xl">
                      {getTransactionIcon(transaction.type)}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-cabin font-semibold text-elite-black">
                          {transaction.reason}
                        </h3>
                        <span
                          className={`font-calistoga text-lg whitespace-nowrap ${
                            transaction.amount > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {transaction.amount > 0 ? '+' : ''}
                          {transaction.amount.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-elite-black/60 font-cabin">
                        <span className="capitalize">{transaction.type}</span>
                        <span>•</span>
                        <span>{formatDate(transaction.createdAt)}</span>
                      </div>

                      {/* Balance after transaction */}
                      <div className="mt-2 pt-2 border-t border-elite-burgundy/10">
                        <span className="text-xs text-elite-black/50 font-cabin">
                          Balance: {transaction.balance.toLocaleString()} pts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </>
  );
}
