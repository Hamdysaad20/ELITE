import { awardOrderCoins as awardEliteCoins, addBonusCoins, redeemCoins } from "./eliteLoyalty";

/**
 * Award loyalty points to a user for completing an order
 * @deprecated Use awardOrderCoins from eliteLoyalty instead
 */
export async function awardOrderPoints(
  orderId: string,
  userId: string,
): Promise<{ pointsAwarded: number; newLevel: string } | null> {
  const result = await awardEliteCoins(orderId, userId);
  if (!result) {
    return null;
  }
  return {
    pointsAwarded: result.coinsAwarded,
    newLevel: result.newTier,
  };
}

/**
 * Deduct loyalty points when redeeming rewards
 * @deprecated Use redeemCoins from eliteLoyalty instead
 */
export async function deductPoints(
  userId: string,
  points: number,
  reason: string,
): Promise<boolean> {
  return await redeemCoins(userId, "", points);
}

/**
 * Add bonus points (promotions, referrals, etc.)
 * @deprecated Use addBonusCoins from eliteLoyalty instead
 */
export async function addBonusPoints(
  userId: string,
  points: number,
  reason: string,
): Promise<boolean> {
  return await addBonusCoins(userId, points, reason);
}
