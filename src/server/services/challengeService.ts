/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/server/db/client";
import { awardChallengeCoins } from "./eliteLoyalty";

// ============================================================================
// CHALLENGE SYSTEM
// ============================================================================

export interface ChallengeRequirement {
  type: string;
  target?: number;
  productIds?: string[];
  categoryIds?: string[];
  minAmount?: number;
  days?: number;
  conditions?: Record<string, unknown>;
}

export interface ChallengeProgress {
  current: number;
  target: number;
  completed: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Get active challenges for a user
 */
export async function getActiveChallenges(userId: string, tier?: string) {
  const now = new Date();

  const challenges = await prisma.challenge.findMany({
    where: {
      isActive: true,
      OR: [
        { startDate: null, endDate: null },
        { startDate: { lte: now }, endDate: { gte: now } },
        { startDate: { lte: now }, endDate: null },
      ],
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  const userCompletions = await prisma.challengeCompletion.findMany({
    where: {
      userId,
      challengeId: { in: challenges.map((c) => c.id) },
    },
  });

  const completionsMap = new Map(userCompletions.map((c) => [c.challengeId, c]));

  return challenges.map((challenge) => {
    const completion = completionsMap.get(challenge.id);
    return {
      ...challenge,
      userProgress: completion?.progress || null,
      completedAt: completion?.completedAt || null,
      isCompleted: !!completion?.completedAt,
    };
  });
}

/**
 * Track progress for purchase-based challenges
 */
export async function trackPurchaseChallenges(
  userId: string,
  orderId: string,
  orderTotal: number,
  items: Array<{ productId: string; categoryId?: string; quantity: number }>,
): Promise<void> {
  const challenges = await getActiveChallenges(userId);

  for (const challenge of challenges) {
    if (challenge.isCompleted) {
      continue;
    }

    const requirement = challenge.requirement as unknown as ChallengeRequirement;
    let progress: ChallengeProgress | null = null;

    switch (requirement.type) {
      case "purchase_count":
        progress = await trackPurchaseCount(userId, challenge.id, requirement);
        break;
      case "spend_amount":
        progress = await trackSpendAmount(userId, challenge.id, requirement, orderTotal);
        break;
      case "product_category":
        progress = await trackCategoryPurchase(userId, challenge.id, requirement, items);
        break;
      case "specific_products":
        progress = await trackSpecificProducts(userId, challenge.id, requirement, items);
        break;
      case "combo":
        progress = await trackCombo(userId, challenge.id, requirement, items);
        break;
    }

    if (progress?.completed) {
      await completeChallenge(userId, challenge.id, challenge.coinsReward, challenge.tier === "elite");
    }
  }
}

/**
 * Track purchase count challenge
 */
async function trackPurchaseCount(
  userId: string,
  challengeId: string,
  requirement: ChallengeRequirement,
): Promise<ChallengeProgress> {
  const target = requirement.target || 1;

  let completion = await prisma.challengeCompletion.findFirst({
    where: { userId, challengeId, completedAt: null },
  });

  if (!completion) {
    completion = await prisma.challengeCompletion.create({
      data: {
        userId,
        challengeId,
        progress: { current: 0, target } as any as any,
      },
    });
  }

  const currentProgress = (completion.progress as unknown as ChallengeProgress) || { current: 0, target };
  const newCurrent = currentProgress.current + 1;
  const completed = newCurrent >= target;

  await prisma.challengeCompletion.update({
    where: { id: completion.id },
    data: {
      progress: { current: newCurrent, target, completed } as any as any as any,
      completedAt: completed ? new Date() : null,
    },
  });

  return { current: newCurrent, target, completed };
}

/**
 * Track spend amount challenge
 */
async function trackSpendAmount(
  userId: string,
  challengeId: string,
  requirement: ChallengeRequirement,
  orderTotal: number,
): Promise<ChallengeProgress> {
  const target = requirement.target || 0;

  let completion = await prisma.challengeCompletion.findFirst({
    where: { userId, challengeId, completedAt: null },
  });

  if (!completion) {
    completion = await prisma.challengeCompletion.create({
      data: {
        userId,
        challengeId,
        progress: { current: 0, target } as any as any,
      },
    });
  }

  const currentProgress = (completion.progress as unknown as ChallengeProgress) || { current: 0, target };
  const newCurrent = currentProgress.current + orderTotal;
  const completed = newCurrent >= target;

  await prisma.challengeCompletion.update({
    where: { id: completion.id },
    data: {
      progress: { current: newCurrent, target, completed } as any as any,
      completedAt: completed ? new Date() : null,
    },
  });

  return { current: newCurrent, target, completed };
}

/**
 * Track category purchase challenge
 */
async function trackCategoryPurchase(
  userId: string,
  challengeId: string,
  requirement: ChallengeRequirement,
  items: Array<{ productId: string; categoryId?: string; quantity: number }>,
): Promise<ChallengeProgress> {
  const targetCategories = requirement.categoryIds || [];
  const target = requirement.target || targetCategories.length;

  let completion = await prisma.challengeCompletion.findFirst({
    where: { userId, challengeId, completedAt: null },
  });

  const purchasedCategories = new Set(
    items.filter((item) => item.categoryId).map((item) => item.categoryId),
  );

  if (!completion) {
    const current = Array.from(purchasedCategories).filter((cat) =>
      targetCategories.includes(cat!),
    ).length;
    completion = await prisma.challengeCompletion.create({
      data: {
        userId,
        challengeId,
        progress: {
          current,
          target,
          purchasedCategories: Array.from(purchasedCategories),
        } as any,
      },
    });
  }

  const currentProgress = (completion.progress as unknown as ChallengeProgress & {
    purchasedCategories?: string[];
  }) || { current: 0, target, purchasedCategories: [] };

  const allPurchasedCategories = new Set([
    ...(currentProgress.purchasedCategories || []),
    ...Array.from(purchasedCategories),
  ]);

  const newCurrent = Array.from(allPurchasedCategories).filter((cat) =>
    targetCategories.includes(cat!),
  ).length;
  const completed = newCurrent >= target;

  await prisma.challengeCompletion.update({
    where: { id: completion.id },
    data: {
      progress: {
        current: newCurrent,
        target,
        completed,
        purchasedCategories: Array.from(allPurchasedCategories),
      } as any,
      completedAt: completed ? new Date() : null,
    },
  });

  return { current: newCurrent, target, completed };
}

/**
 * Track specific products challenge
 */
async function trackSpecificProducts(
  userId: string,
  challengeId: string,
  requirement: ChallengeRequirement,
  items: Array<{ productId: string; categoryId?: string; quantity: number }>,
): Promise<ChallengeProgress> {
  const targetProducts = requirement.productIds || [];
  const target = requirement.target || targetProducts.length;

  let completion = await prisma.challengeCompletion.findFirst({
    where: { userId, challengeId, completedAt: null },
  });

  const purchasedProducts = new Set(items.map((item) => item.productId));

  if (!completion) {
    const current = Array.from(purchasedProducts).filter((prod) =>
      targetProducts.includes(prod),
    ).length;
    completion = await prisma.challengeCompletion.create({
      data: {
        userId,
        challengeId,
        progress: {
          current,
          target,
          purchasedProducts: Array.from(purchasedProducts),
        } as any,
      },
    });
  }

  const currentProgress = (completion.progress as unknown as ChallengeProgress & {
    purchasedProducts?: string[];
  }) || { current: 0, target, purchasedProducts: [] };

  const allPurchasedProducts = new Set([
    ...(currentProgress.purchasedProducts || []),
    ...Array.from(purchasedProducts),
  ]);

  const newCurrent = Array.from(allPurchasedProducts).filter((prod) =>
    targetProducts.includes(prod),
  ).length;
  const completed = newCurrent >= target;

  await prisma.challengeCompletion.update({
    where: { id: completion.id },
    data: {
      progress: {
        current: newCurrent,
        target,
        completed,
        purchasedProducts: Array.from(allPurchasedProducts),
      } as any,
      completedAt: completed ? new Date() : null,
    },
  });

  return { current: newCurrent, target, completed };
}

/**
 * Track combo challenge (buy X items in one order)
 */
async function trackCombo(
  userId: string,
  challengeId: string,
  requirement: ChallengeRequirement,
  items: Array<{ productId: string; categoryId?: string; quantity: number }>,
): Promise<ChallengeProgress> {
  const targetProducts = requirement.productIds || [];
  const target = targetProducts.length;

  const purchasedProducts = new Set(items.map((item) => item.productId));
  const matchedProducts = Array.from(purchasedProducts).filter((prod) =>
    targetProducts.includes(prod),
  );

  const completed = matchedProducts.length >= target;

  let completion = await prisma.challengeCompletion.findFirst({
    where: { userId, challengeId, completedAt: null },
  });

  if (!completion) {
    completion = await prisma.challengeCompletion.create({
      data: {
        userId,
        challengeId,
        progress: {
          current: matchedProducts.length,
          target,
          completed,
        } as any,
        completedAt: completed ? new Date() : null,
      },
    });
  } else if (completed && !completion.completedAt) {
    await prisma.challengeCompletion.update({
      where: { id: completion.id },
      data: {
        progress: {
          current: matchedProducts.length,
          target,
          completed,
        } as any,
        completedAt: new Date(),
      },
    });
  }

  return { current: matchedProducts.length, target, completed };
}

/**
 * Complete a challenge and award coins
 */
async function completeChallenge(
  userId: string,
  challengeId: string,
  coinsReward: number,
  isElite: boolean,
): Promise<void> {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    return;
  }

  await awardChallengeCoins(userId, challengeId, coinsReward, isElite);

  if (challenge.avatarUnlock) {
    await unlockAvatar(userId, challenge.avatarUnlock);
  }

  console.log(
    `🎯 User ${userId} completed ${isElite ? "ELITE" : ""} challenge: ${challenge.title}`,
  );
}

/**
 * Unlock an avatar for a user
 */
async function unlockAvatar(userId: string, avatarId: string): Promise<void> {
  const existing = await prisma.userAvatar.findUnique({
    where: {
      userId_avatarId: {
        userId,
        avatarId,
      },
    },
  });

  if (!existing) {
    await prisma.userAvatar.create({
      data: {
        userId,
        avatarId,
        unlockedAt: new Date(),
      },
    });
    console.log(`✨ Avatar ${avatarId} unlocked for user ${userId}`);
  }
}

/**
 * Track social action challenges (reviews, shares, etc.)
 */
export async function trackSocialChallenge(
  userId: string,
  actionType: "review" | "share" | "rating",
): Promise<void> {
  const challenges = await getActiveChallenges(userId);

  for (const challenge of challenges) {
    if (challenge.isCompleted) {
      continue;
    }

    const requirement = challenge.requirement as unknown as ChallengeRequirement;

    if (requirement.type === actionType) {
      const target = requirement.target || 1;

      let completion = await prisma.challengeCompletion.findFirst({
        where: { userId, challengeId: challenge.id, completedAt: null },
      });

      if (!completion) {
        completion = await prisma.challengeCompletion.create({
          data: {
            userId,
            challengeId: challenge.id,
            progress: { current: 0, target } as any as any,
          },
        });
      }

      const currentProgress = (completion.progress as unknown as ChallengeProgress) || {
        current: 0,
        target,
      };
      const newCurrent = currentProgress.current + 1;
      const completed = newCurrent >= target;

      await prisma.challengeCompletion.update({
        where: { id: completion.id },
        data: {
          progress: { current: newCurrent, target, completed } as any as any,
          completedAt: completed ? new Date() : null,
        },
      });

      if (completed) {
        await completeChallenge(
          userId,
          challenge.id,
          challenge.coinsReward,
          challenge.tier === "elite",
        );
      }
    }
  }
}

/**
 * Reset recurring challenges (called by cron job)
 */
export async function resetRecurringChallenges(period: "weekly" | "monthly"): Promise<void> {
  const challenges = await prisma.challenge.findMany({
    where: {
      isActive: true,
      isRecurring: true,
      recurringPeriod: period,
    },
  });

  const now = new Date();

  for (const challenge of challenges) {
    const completions = await prisma.challengeCompletion.findMany({
      where: {
        challengeId: challenge.id,
        completedAt: { not: null },
      },
    });

    for (const completion of completions) {
      await prisma.challengeCompletion.update({
        where: { id: completion.id },
        data: {
          progress: { current: 0, target: (challenge.requirement as unknown as ChallengeRequirement).target || 0 } as any as any,
          completedAt: null,
          periodStart: now,
        },
      });
    }
  }

  console.log(`🔄 Reset ${period} challenges: ${challenges.length} challenges affected`);
}
