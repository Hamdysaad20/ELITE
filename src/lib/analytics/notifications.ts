import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TierBenefits {
  name: string;
  emoji: string;
  color: string;
  benefits: string[];
  pointsRequired: number;
}

export const TIER_CONFIG: Record<string, TierBenefits> = {
  bronze: {
    name: 'Bronze',
    emoji: '🥉',
    color: 'from-orange-600 to-orange-800',
    benefits: ['Earn points on every order', 'Birthday month 2x points'],
    pointsRequired: 0,
  },
  silver: {
    name: 'Silver',
    emoji: '🥈',
    color: 'from-gray-400 to-gray-600',
    benefits: [
      'All Bronze benefits',
      '5% bonus points on orders',
      'Early access to new products',
      'Priority customer support',
    ],
    pointsRequired: 100000, // 1,000 EGP
  },
  gold: {
    name: 'Gold',
    emoji: '🥇',
    color: 'from-yellow-400 to-yellow-600',
    benefits: [
      'All Silver benefits',
      '10% bonus points on orders',
      'Free delivery on all orders',
      'Exclusive gold member events',
      'Birthday gift',
    ],
    pointsRequired: 500000, // 5,000 EGP
  },
  platinum: {
    name: 'Platinum',
    emoji: '💎',
    color: 'from-purple-400 to-purple-600',
    benefits: [
      'All Gold benefits',
      '15% bonus points on orders',
      'Personal account manager',
      'VIP lounge access',
      'Exclusive platinum rewards',
      'Partner discounts',
    ],
    pointsRequired: 1000000, // 10,000 EGP
  },
};

export function getTierByPoints(totalEarned: number): string {
  if (totalEarned >= 1000000) return 'platinum';
  if (totalEarned >= 500000) return 'gold';
  if (totalEarned >= 100000) return 'silver';
  return 'bronze';
}

export function getNextTier(currentTier: string): string | null {
  const tiers = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIndex = tiers.indexOf(currentTier);
  if (currentIndex === -1 || currentIndex === tiers.length - 1) return null;
  return tiers[currentIndex + 1];
}

export function getPointsToNextTier(currentTier: string, totalEarned: number): number {
  const nextTier = getNextTier(currentTier);
  if (!nextTier) return 0;
  return TIER_CONFIG[nextTier].pointsRequired - totalEarned;
}

export async function checkAndNotifyTierUpgrade(
  userId: string,
  previousPoints: number,
  newPoints: number
): Promise<boolean> {
  const previousTier = getTierByPoints(previousPoints);
  const newTier = getTierByPoints(newPoints);

  if (previousTier !== newTier) {
    // Create tier upgrade notification
    await createTierUpgradeNotification(userId, previousTier, newTier, newPoints);
    return true;
  }

  return false;
}

async function createTierUpgradeNotification(
  userId: string,
  previousTier: string,
  newTier: string,
  totalPoints: number
): Promise<void> {
  const tierInfo = TIER_CONFIG[newTier];

  // In a real app, you'd save this to a Notifications table
  // For now, we'll log it and could send via email/push
  console.log(`🎉 TIER UPGRADE: User ${userId} upgraded from ${previousTier} to ${newTier}`);

  // You could integrate with services like:
  // - SendGrid for email notifications
  // - Firebase Cloud Messaging for push notifications
  // - In-app notification system

  const notification = {
    userId,
    type: 'tier_upgrade',
    title: `Congratulations! You're now ${tierInfo.name} ${tierInfo.emoji}`,
    message: `You've been upgraded to ${tierInfo.name} tier with ${totalPoints.toLocaleString()} points! Enjoy your new benefits.`,
    data: {
      previousTier,
      newTier,
      benefits: tierInfo.benefits,
      pointsEarned: totalPoints,
    },
  };

  // Store notification (you'd add a Notification model to Prisma schema)
  // await prisma.notification.create({ data: notification });

  // Send email notification
  // await sendTierUpgradeEmail(userId, notification);

  // Send push notification
  // await sendPushNotification(userId, notification);
}

export async function createPointsEarnedNotification(
  userId: string,
  points: number,
  orderId: string,
  reason: string
): Promise<void> {
  const notification = {
    userId,
    type: 'points_earned',
    title: `+${points.toLocaleString()} Points Earned! ⭐`,
    message: `You earned ${points.toLocaleString()} points (worth EGP ${(points / 100).toFixed(2)}) ${reason}`,
    data: {
      points,
      orderId,
      reason,
    },
  };

  console.log(`⭐ POINTS EARNED: User ${userId} earned ${points} points`);

  // Store and send notification
  // await prisma.notification.create({ data: notification });
  // await sendPointsNotification(userId, notification);
}

export async function createSavingsMilestoneNotification(
  userId: string,
  totalSaved: number,
  milestone: number
): Promise<void> {
  const notification = {
    userId,
    type: 'savings_milestone',
    title: `💰 Savings Milestone Reached!`,
    message: `Congratulations! You've saved EGP ${totalSaved.toFixed(2)} total. You've reached the EGP ${milestone} savings milestone!`,
    data: {
      totalSaved,
      milestone,
    },
  };

  console.log(`💰 SAVINGS MILESTONE: User ${userId} saved ${totalSaved} total`);

  // Store and send notification
  // await prisma.notification.create({ data: notification });
}

export async function checkSavingsMilestone(
  userId: string,
  totalSaved: number
): Promise<void> {
  const milestones = [100, 250, 500, 1000, 2500, 5000, 10000];

  for (const milestone of milestones) {
    const previousTotal = totalSaved - milestone;
    if (previousTotal < milestone && totalSaved >= milestone) {
      await createSavingsMilestoneNotification(userId, totalSaved, milestone);
      break;
    }
  }
}
