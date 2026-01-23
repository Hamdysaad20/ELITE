import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/server/auth/options";
import { prisma } from "@/server/db/client";
import {
  getRewardById,
  canUserRedeemReward,
  generateRewardCode,
  type Reward,
} from "@/lib/rewards/catalog";
import { updateUserPoints } from "@/lib/analytics/points";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(getAuthOptions());

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { userPoints: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { rewardId } = await request.json();

    if (!rewardId) {
      return NextResponse.json(
        { error: "Reward ID is required" },
        { status: 400 },
      );
    }

    // Get reward details
    const reward = getRewardById(rewardId);
    if (!reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    // Check if user can redeem
    const userPoints = user.userPoints?.totalPoints || 0;
    const userTier = user.userPoints?.tier || "bronze";

    const { canRedeem, reason } = canUserRedeemReward(
      reward,
      userPoints,
      userTier,
    );

    if (!canRedeem) {
      return NextResponse.json({ error: reason }, { status: 400 });
    }

    // Generate unique code
    const code = generateRewardCode();

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + reward.expiryDays);

    // Create redeemed reward record (you'd need to add RedeemedReward model to Prisma)
    // For now, we'll create it in PointsTransaction with special type
    await updateUserPoints(
      user.id,
      reward.pointsCost,
      "redeem",
      undefined,
      `Redeemed: ${reward.name} (Code: ${code})`,
    );

    // In a real implementation, you'd save to a RedeemedRewards table
    // const redeemedReward = await prisma.redeemedReward.create({
    //   data: {
    //     userId: user.id,
    //     rewardId: reward.id,
    //     rewardName: reward.name,
    //     pointsSpent: reward.pointsCost,
    //     code,
    //     status: 'active',
    //     expiresAt,
    //   },
    // });

    return NextResponse.json({
      success: true,
      reward: {
        id: reward.id,
        name: reward.name,
        description: reward.description,
        type: reward.type,
        value: reward.value,
        code,
        expiresAt,
        pointsSpent: reward.pointsCost,
        remainingPoints: userPoints - reward.pointsCost,
      },
    });
  } catch (error) {
    console.error("Error redeeming reward:", error);
    return NextResponse.json(
      { error: "Failed to redeem reward" },
      { status: 500 },
    );
  }
}
