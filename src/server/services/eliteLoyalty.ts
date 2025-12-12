import { prisma } from "@/server/db/client";
import { Decimal } from "@prisma/client/runtime/library";

// ============================================================================
// ELITE REWARDS SYSTEM - CONFIGURATION
// ============================================================================

// Exchange rate: 100 coins = 1 EGP
export const COINS_PER_EGP = 100;

// Base earn rate: 10 coins per 1 EGP spent (before multipliers)
export const BASE_COINS_PER_EGP_SPENT = 10;

// ============================================================================
// 10-TIER ELITE CARD SYSTEM
// ============================================================================

export interface TierConfig {
  id: string;
  name: string;
  multiplier: number; // Percentage multiplier (0-25%)
  monthlyRequirements: {
    coinsEarned: number;
    purchases: number;
    challenges?: number;
    eliteChallenges?: number;
    streakDays: number;
  };
  benefits: string[];
  color: string;
  icon: string;
}

export const ELITE_TIERS: Record<string, TierConfig> = {
  starter: {
    id: "starter",
    name: "Starter",
    multiplier: 0,
    monthlyRequirements: {
      coinsEarned: 0,
      purchases: 0,
      streakDays: 0,
    },
    benefits: ["Earn coins on purchases", "Access to rewards shop"],
    color: "#9CA3AF",
    icon: "🌟",
  },
  black: {
    id: "black",
    name: "Black",
    multiplier: 5,
    monthlyRequirements: {
      coinsEarned: 1500,
      purchases: 2,
      streakDays: 3,
    },
    benefits: ["5% bonus coins", "Early access to challenges", "Birthday reward"],
    color: "#1F2937",
    icon: "⚫",
  },
  silver: {
    id: "silver",
    name: "Silver",
    multiplier: 7,
    monthlyRequirements: {
      coinsEarned: 3000,
      purchases: 3,
      challenges: 1,
      streakDays: 5,
    },
    benefits: ["7% bonus coins", "Free delivery on orders over 200 EGP", "Priority support"],
    color: "#9CA3AF",
    icon: "⚪",
  },
  gold: {
    id: "gold",
    name: "Gold",
    multiplier: 10,
    monthlyRequirements: {
      coinsEarned: 6000,
      purchases: 4,
      challenges: 2,
      streakDays: 7,
    },
    benefits: ["10% bonus coins", "Free delivery", "Exclusive avatars", "Monthly bonus"],
    color: "#F59E0B",
    icon: "🟡",
  },
  platinum: {
    id: "platinum",
    name: "Platinum",
    multiplier: 12,
    monthlyRequirements: {
      coinsEarned: 10000,
      purchases: 5,
      challenges: 3,
      streakDays: 10,
    },
    benefits: ["12% bonus coins", "Free delivery", "Double challenge rewards", "VIP support"],
    color: "#8B5CF6",
    icon: "🟣",
  },
  diamond: {
    id: "diamond",
    name: "Diamond",
    multiplier: 14,
    monthlyRequirements: {
      coinsEarned: 14000,
      purchases: 6,
      challenges: 4,
      streakDays: 12,
    },
    benefits: ["14% bonus coins", "Free delivery", "Exclusive merchandise", "VIP events access"],
    color: "#06B6D4",
    icon: "💎",
  },
  ruby: {
    id: "ruby",
    name: "Ruby",
    multiplier: 16,
    monthlyRequirements: {
      coinsEarned: 20000,
      purchases: 7,
      challenges: 5,
      eliteChallenges: 1,
      streakDays: 15,
    },
    benefits: ["16% bonus coins", "Free delivery", "Elite challenges access", "Personalized offers"],
    color: "#DC2626",
    icon: "🔴",
  },
  obsidian: {
    id: "obsidian",
    name: "Obsidian",
    multiplier: 18,
    monthlyRequirements: {
      coinsEarned: 26000,
      purchases: 8,
      challenges: 6,
      streakDays: 18,
    },
    benefits: ["18% bonus coins", "Free delivery", "Mystery boxes", "Concierge service"],
    color: "#18181B",
    icon: "⬛",
  },
  eliteBlack: {
    id: "eliteBlack",
    name: "Elite Black",
    multiplier: 20,
    monthlyRequirements: {
      coinsEarned: 35000,
      purchases: 10,
      challenges: 8,
      streakDays: 20,
    },
    benefits: ["20% bonus coins", "Free delivery", "Exclusive avatars", "Private events", "Dedicated manager"],
    color: "#000000",
    icon: "👑",
  },
  founder: {
    id: "founder",
    name: "Founder's Tier",
    multiplier: 25,
    monthlyRequirements: {
      coinsEarned: 50000,
      purchases: 12,
      challenges: 10,
      streakDays: 25,
    },
    benefits: ["25% bonus coins", "Free delivery", "Lifetime perks", "Founder avatar", "Co-creation opportunities", "All exclusive content"],
    color: "#FFD700",
    icon: "👑✨",
  },
};

export const TIER_ORDER = [
  "starter",
  "black",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "ruby",
  "obsidian",
  "eliteBlack",
  "founder",
];

// ============================================================================
// STREAK REWARDS CONFIGURATION
// ============================================================================

export const STREAK_REWARDS = {
  daily: [
    { days: 3, coins: 100, label: "3-Day Streak" },
    { days: 7, coins: 300, label: "Weekly Warrior" },
    { days: 14, coins: 700, label: "2-Week Champion" },
    { days: 21, coins: 1200, label: "3-Week Legend" },
    { days: 30, coins: 2000, label: "Monthly Master" },
    { days: 60, coins: 5000, label: "Elite Dedication" },
    { days: 90, coins: 10000, label: "Quarterly King" },
  ],
  weekly: {
    orders: [
      { count: 2, coins: 200, label: "Active Week" },
      { count: 4, coins: 500, label: "Super Week" },
      { count: 7, coins: 1000, label: "Ultra Week" },
    ],
  },
  monthly: {
    orders: [
      { count: 8, coins: 800, label: "Active Month" },
      { count: 15, coins: 2000, label: "Super Month" },
      { count: 25, coins: 4000, label: "Elite Month" },
    ],
  },
};

// ============================================================================
// SOCIAL ACTION REWARDS
// ============================================================================

export const SOCIAL_REWARDS = {
  review: 100, // Per product review
  rating: 50, // Per product rating (no text)
  share: 25, // Per share action
  referral: 1000, // Per successful referral (friend's first order)
  helpfulReview: 10, // When someone marks review as helpful
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Calculate coins earned from a purchase
 */
export function calculatePurchaseCoins(
  amountEGP: number,
  tierMultiplier: number,
): number {
  const baseCoins = Math.floor(amountEGP * BASE_COINS_PER_EGP_SPENT);
  const multiplierBonus = Math.floor(baseCoins * (tierMultiplier / 100));
  return baseCoins + multiplierBonus;
}

/**
 * Award coins for a completed order
 */
export async function awardOrderCoins(
  orderId: string,
  userId: string,
): Promise<{ coinsAwarded: number; newTier: string } | null> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        total: true,
        status: true,
        userId: true,
        createdAt: true,
      },
    });

    if (!order) {
      console.warn(`⚠️ Order ${orderId} not found`);
      return null;
    }

    if (!["DELIVERED", "COMPLETED"].includes(order.status)) {
      console.log(`ℹ️ Order ${orderId} status is ${order.status}, not awarding coins yet`);
      return null;
    }

    if (order.userId !== userId) {
      console.warn(`⚠️ Order ${orderId} does not belong to user ${userId}`);
      return null;
    }

    const existingEntry = await prisma.loyaltyLedger.findFirst({
      where: { orderId, userId },
    });

    if (existingEntry) {
      console.log(`ℹ️ Coins already awarded for order ${orderId}`);
      return null;
    }

    let loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { userId },
    });

    if (!loyaltyAccount) {
      loyaltyAccount = await prisma.loyaltyAccount.create({
        data: {
          userId,
          coins: 0,
          lifetimeCoins: 0,
          totalSpent: 0,
          tier: "starter",
          tierMultiplier: 0,
        },
      });
    }

    const coinsAwarded = calculatePurchaseCoins(
      Number(order.total),
      Number(loyaltyAccount.tierMultiplier),
    );

    await prisma.loyaltyLedger.create({
      data: {
        userId,
        orderId,
        deltaCoins: coinsAwarded,
        reason: `Order completed - ${order.total} EGP`,
        source: "order",
      },
    });

    const newCoins = loyaltyAccount.coins + coinsAwarded;
    const newLifetimeCoins = loyaltyAccount.lifetimeCoins + coinsAwarded;
    const newTotalSpent = new Decimal(loyaltyAccount.totalSpent).add(new Decimal(order.total));

    await prisma.loyaltyAccount.update({
      where: { userId },
      data: {
        coins: newCoins,
        lifetimeCoins: newLifetimeCoins,
        totalSpent: newTotalSpent,
      },
    });

    await updateStreakForOrder(userId, order.createdAt);
    await updateMonthlyProgress(userId, coinsAwarded, 1);

    console.log(`✅ Awarded ${coinsAwarded} coins to user ${userId} for order ${orderId}`);

    return { coinsAwarded, newTier: loyaltyAccount.tier };
  } catch (error) {
    console.error(`❌ Failed to award coins for order ${orderId}:`, error);
    return null;
  }
}

/**
 * Update user's streak when they make an order
 */
async function updateStreakForOrder(userId: string, orderDate: Date): Promise<void> {
  let streak = await prisma.userStreak.findUnique({
    where: { userId },
  });

  const now = orderDate;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!streak) {
    streak = await prisma.userStreak.create({
      data: {
        userId,
        currentDaily: 1,
        longestDaily: 1,
        lastActivityDate: today,
        weeklyCount: 1,
        monthlyCount: 1,
        totalDaysActive: 1,
      },
    });
    return;
  }

  const lastActivity = streak.lastActivityDate
    ? new Date(
        streak.lastActivityDate.getFullYear(),
        streak.lastActivityDate.getMonth(),
        streak.lastActivityDate.getDate(),
      )
    : null;

  let newCurrentDaily = streak.currentDaily;
  let awardStreakCoins = false;

  if (!lastActivity || lastActivity.getTime() !== today.getTime()) {
    const daysDiff = lastActivity
      ? Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    if (daysDiff === 1) {
      newCurrentDaily = streak.currentDaily + 1;
      awardStreakCoins = true;
    } else if (daysDiff > 1) {
      newCurrentDaily = 1;
    }

    await prisma.userStreak.update({
      where: { userId },
      data: {
        currentDaily: newCurrentDaily,
        longestDaily: Math.max(newCurrentDaily, streak.longestDaily),
        lastActivityDate: today,
        weeklyCount: { increment: 1 },
        monthlyCount: { increment: 1 },
        totalDaysActive: { increment: 1 },
      },
    });

    if (awardStreakCoins) {
      await checkAndAwardStreakMilestone(userId, newCurrentDaily);
    }
  }
}

/**
 * Check and award streak milestone rewards
 */
async function checkAndAwardStreakMilestone(userId: string, streakDays: number): Promise<void> {
  const milestone = STREAK_REWARDS.daily.find((m) => m.days === streakDays);

  if (milestone) {
    await prisma.loyaltyLedger.create({
      data: {
        userId,
        deltaCoins: milestone.coins,
        reason: `Streak milestone: ${milestone.label}`,
        source: "streak",
        metadata: { streakDays, milestone: milestone.label },
      },
    });

    await prisma.loyaltyAccount.update({
      where: { userId },
      data: {
        coins: { increment: milestone.coins },
        lifetimeCoins: { increment: milestone.coins },
      },
    });

    console.log(`🔥 Awarded ${milestone.coins} coins for ${milestone.label} to user ${userId}`);
  }
}

/**
 * Update monthly progress for tier requirements
 */
async function updateMonthlyProgress(
  userId: string,
  coinsEarned: number,
  purchaseCount: number,
): Promise<void> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
    where: { userId },
  });

  const progress = await prisma.monthlyTierProgress.upsert({
    where: { userId },
    update: {
      coinsEarned: { increment: coinsEarned },
      purchaseCount: { increment: purchaseCount },
      lastActivityDate: now,
    },
    create: {
      userId,
      month,
      year,
      coinsEarned,
      purchaseCount,
      tierAtStart: loyaltyAccount?.tier || "starter",
      lastActivityDate: now,
    },
  });

  const streak = await prisma.userStreak.findUnique({
    where: { userId },
  });

  if (progress && streak) {
    await prisma.monthlyTierProgress.update({
      where: { userId },
      data: {
        maxStreakDays: Math.max(progress.maxStreakDays, streak.currentDaily),
        currentStreakDays: streak.currentDaily,
      },
    });
  }
}

/**
 * Check if user meets tier requirements and update tier
 */
export async function checkAndUpdateTier(userId: string): Promise<string> {
  const progress = await prisma.monthlyTierProgress.findUnique({
    where: { userId },
  });

  if (!progress) {
    return "starter";
  }

  let qualifiedTier = "starter";

  for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
    const tierId = TIER_ORDER[i];
    const tier = ELITE_TIERS[tierId];

    const meetsCoins = progress.coinsEarned >= tier.monthlyRequirements.coinsEarned;
    const meetsPurchases = progress.purchaseCount >= tier.monthlyRequirements.purchases;
    const meetsChallenges = tier.monthlyRequirements.challenges
      ? progress.challengesComplete >= tier.monthlyRequirements.challenges
      : true;
    const meetsEliteChallenges = tier.monthlyRequirements.eliteChallenges
      ? progress.eliteChallengesComplete >= tier.monthlyRequirements.eliteChallenges
      : true;
    const meetsStreak = progress.maxStreakDays >= tier.monthlyRequirements.streakDays;

    if (
      meetsCoins &&
      meetsPurchases &&
      meetsChallenges &&
      meetsEliteChallenges &&
      meetsStreak
    ) {
      qualifiedTier = tierId;
      break;
    }
  }

  await prisma.loyaltyAccount.update({
    where: { userId },
    data: {
      tier: qualifiedTier,
      tierMultiplier: ELITE_TIERS[qualifiedTier].multiplier,
      lastTierCheck: new Date(),
    },
  });

  await prisma.monthlyTierProgress.update({
    where: { userId },
    data: {
      meetsRequirements: true,
      tierAtEnd: qualifiedTier,
    },
  });

  console.log(`✅ User ${userId} tier updated to ${qualifiedTier}`);
  return qualifiedTier;
}

/**
 * Award coins for completing a challenge
 */
export async function awardChallengeCoins(
  userId: string,
  challengeId: string,
  coinsReward: number,
  isEliteChallenge: boolean,
): Promise<boolean> {
  try {
    await prisma.loyaltyLedger.create({
      data: {
        userId,
        deltaCoins: coinsReward,
        reason: `Challenge completed`,
        source: "challenge",
        metadata: { challengeId, isElite: isEliteChallenge },
      },
    });

    await prisma.loyaltyAccount.update({
      where: { userId },
      data: {
        coins: { increment: coinsReward },
        lifetimeCoins: { increment: coinsReward },
      },
    });

    const field = isEliteChallenge ? "eliteChallengesComplete" : "challengesComplete";
    await prisma.monthlyTierProgress.update({
      where: { userId },
      data: {
        [field]: { increment: 1 },
      },
    });

    console.log(`✅ Awarded ${coinsReward} coins for challenge completion to user ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to award challenge coins:`, error);
    return false;
  }
}

/**
 * Award coins for social actions
 */
export async function awardSocialCoins(
  userId: string,
  actionType: "review" | "rating" | "share" | "referral",
  targetId?: string,
  metadata?: Record<string, unknown>,
): Promise<boolean> {
  try {
    const coinsReward = SOCIAL_REWARDS[actionType] || 0;

    if (coinsReward === 0) {
      return false;
    }

    const existingAction = await prisma.socialAction.findUnique({
      where: {
        userId_actionType_targetId: {
          userId,
          actionType,
          targetId: targetId || "",
        },
      },
    });

    if (existingAction) {
      console.log(`ℹ️ Social action already rewarded: ${actionType} for ${targetId}`);
      return false;
    }

    await prisma.socialAction.create({
      data: {
        userId,
        actionType,
        targetId,
        coinsAwarded: coinsReward,
        metadata,
      },
    });

    await prisma.loyaltyLedger.create({
      data: {
        userId,
        deltaCoins: coinsReward,
        reason: `Social action: ${actionType}`,
        source: "social",
        metadata: { actionType, targetId, ...metadata },
      },
    });

    await prisma.loyaltyAccount.update({
      where: { userId },
      data: {
        coins: { increment: coinsReward },
        lifetimeCoins: { increment: coinsReward },
      },
    });

    console.log(`✅ Awarded ${coinsReward} coins for ${actionType} to user ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to award social coins:`, error);
    return false;
  }
}

/**
 * Redeem coins for a reward
 */
export async function redeemCoins(
  userId: string,
  rewardItemId: string,
  coinsCost: number,
): Promise<boolean> {
  try {
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { userId },
    });

    if (!loyaltyAccount || loyaltyAccount.coins < coinsCost) {
      console.warn(`⚠️ User ${userId} has insufficient coins for redemption`);
      return false;
    }

    await prisma.loyaltyLedger.create({
      data: {
        userId,
        deltaCoins: -coinsCost,
        reason: `Redeemed reward`,
        source: "redemption",
        metadata: { rewardItemId },
      },
    });

    await prisma.loyaltyAccount.update({
      where: { userId },
      data: {
        coins: { decrement: coinsCost },
      },
    });

    console.log(`✅ User ${userId} redeemed ${coinsCost} coins for reward ${rewardItemId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to redeem coins:`, error);
    return false;
  }
}

/**
 * Add bonus coins (admin, promotions, etc.)
 */
export async function addBonusCoins(
  userId: string,
  coins: number,
  reason: string,
  metadata?: Record<string, unknown>,
): Promise<boolean> {
  try {
    let loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { userId },
    });

    if (!loyaltyAccount) {
      loyaltyAccount = await prisma.loyaltyAccount.create({
        data: {
          userId,
          coins: 0,
          lifetimeCoins: 0,
          totalSpent: 0,
          tier: "starter",
          tierMultiplier: 0,
        },
      });
    }

    await prisma.loyaltyLedger.create({
      data: {
        userId,
        deltaCoins: coins,
        reason,
        source: "admin",
        metadata,
      },
    });

    await prisma.loyaltyAccount.update({
      where: { userId },
      data: {
        coins: { increment: coins },
        lifetimeCoins: { increment: coins },
      },
    });

    console.log(`✅ Added ${coins} bonus coins to user ${userId}: ${reason}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to add bonus coins:`, error);
    return false;
  }
}

/**
 * Get next tier for a user
 */
export function getNextTier(currentTier: string): TierConfig | null {
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  if (currentIndex === -1 || currentIndex === TIER_ORDER.length - 1) {
    return null;
  }
  return ELITE_TIERS[TIER_ORDER[currentIndex + 1]];
}

/**
 * Calculate progress to next tier
 */
export function calculateTierProgress(
  currentTier: string,
  monthlyProgress: {
    coinsEarned: number;
    purchaseCount: number;
    challengesComplete: number;
    eliteChallengesComplete: number;
    maxStreakDays: number;
  },
): {
  coinsProgress: number;
  purchasesProgress: number;
  challengesProgress: number;
  streakProgress: number;
  overallProgress: number;
} {
  const nextTier = getNextTier(currentTier);

  if (!nextTier) {
    return {
      coinsProgress: 100,
      purchasesProgress: 100,
      challengesProgress: 100,
      streakProgress: 100,
      overallProgress: 100,
    };
  }

  const coinsProgress = Math.min(
    100,
    (monthlyProgress.coinsEarned / nextTier.monthlyRequirements.coinsEarned) * 100,
  );
  const purchasesProgress = Math.min(
    100,
    (monthlyProgress.purchaseCount / nextTier.monthlyRequirements.purchases) * 100,
  );
  const challengesProgress = nextTier.monthlyRequirements.challenges
    ? Math.min(
        100,
        (monthlyProgress.challengesComplete / nextTier.monthlyRequirements.challenges) * 100,
      )
    : 100;
  const streakProgress = Math.min(
    100,
    (monthlyProgress.maxStreakDays / nextTier.monthlyRequirements.streakDays) * 100,
  );

  const overallProgress =
    (coinsProgress + purchasesProgress + challengesProgress + streakProgress) / 4;

  return {
    coinsProgress,
    purchasesProgress,
    challengesProgress,
    streakProgress,
    overallProgress,
  };
}
