import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAvailableRewards } from '@/lib/rewards/catalog';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { userPoints: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userTier = user.userPoints?.tier || 'bronze';
    const userPoints = user.userPoints?.totalPoints || 0;

    // Get available rewards for user's tier
    const rewards = getAvailableRewards(userTier);

    // Add affordability flag to each reward
    const rewardsWithStatus = rewards.map((reward) => ({
      ...reward,
      canAfford: userPoints >= reward.pointsCost,
      pointsNeeded:
        userPoints < reward.pointsCost
          ? reward.pointsCost - userPoints
          : 0,
    }));

    return NextResponse.json({
      rewards: rewardsWithStatus,
      userPoints,
      userTier,
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
}
