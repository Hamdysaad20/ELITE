"use client";

import { Award, Star } from "lucide-react";

interface PointsCardProps {
  balance: number;
  tier: string;
  nextTierAt: number;
  pointsToNextTier?: number;
  compact?: boolean;
}

const tierColors = {
  bronze: 'bg-gradient-to-br from-amber-700 to-amber-900',
  silver: 'bg-gradient-to-br from-gray-300 to-gray-500',
  gold: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
  platinum: 'bg-gradient-to-br from-purple-400 to-purple-600',
};

const tierIcons = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
};

export function PointsCard({ 
  balance, 
  tier, 
  nextTierAt, 
  pointsToNextTier,
  compact = false 
}: PointsCardProps) {
  const progress = nextTierAt > 0 ? (balance / nextTierAt) * 100 : 100;
  const pointsValue = balance / 100; // 100 points = 1 EGP

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-elite-burgundy/10 rounded-2xl">
        <Star className="w-4 h-4 text-elite-burgundy flex-shrink-0" />
        <div className="flex items-baseline gap-1">
          <span className="font-calistoga text-elite-burgundy text-base">
            {balance.toLocaleString()}
          </span>
          <span className="font-cabin text-elite-black/60 text-xs">
            pts
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award className="w-6 h-6 text-elite-burgundy" />
          <h3 className="font-calistoga text-xl text-elite-black">Points Balance</h3>
        </div>
        <span className="text-2xl">{tierIcons[tier as keyof typeof tierIcons] || '🥉'}</span>
      </div>
      
      <p className="font-calistoga text-4xl text-elite-burgundy mb-1">
        {balance.toLocaleString()}
      </p>
      <p className="text-sm text-elite-black/60 font-cabin mb-4">
        Worth EGP {pointsValue.toFixed(2)}
      </p>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-cabin font-semibold text-elite-black capitalize">
            {tier} Member
          </span>
          <span className="text-elite-black/60 font-cabin">
            {Math.min(progress, 100).toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-elite-cream rounded-full h-2 overflow-hidden">
          <div 
            className="bg-elite-burgundy h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        {pointsToNextTier !== undefined && pointsToNextTier > 0 && (
          <p className="text-xs text-elite-black/60 font-cabin">
            {pointsToNextTier.toLocaleString()} points to next tier
          </p>
        )}
      </div>
    </div>
  );
}
