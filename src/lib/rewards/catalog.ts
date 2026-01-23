// Reward catalog and redemption types

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  value: number; // EGP value
  type: "discount" | "free_delivery" | "free_item" | "gift_card";
  minTier?: "bronze" | "silver" | "gold" | "platinum";
  available: boolean;
  imageUrl?: string;
  terms?: string[];
  expiryDays: number; // Days until reward expires after redemption
}

export interface RedeemedReward {
  id: string;
  userId: string;
  rewardId: string;
  rewardName: string;
  pointsSpent: number;
  code: string; // Unique code for the reward
  status: "active" | "used" | "expired";
  redeemedAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  orderId?: string; // Order where reward was used
}

// Rewards Catalog
export const REWARDS_CATALOG: Reward[] = [
  {
    id: "discount-10",
    name: "10 EGP Discount",
    description: "Get 10 EGP off your next order (min. 100 EGP)",
    pointsCost: 1000, // 10 EGP = 1000 points
    value: 10,
    type: "discount",
    available: true,
    terms: [
      "Minimum order value: 100 EGP",
      "Cannot be combined with other offers",
    ],
    expiryDays: 30,
  },
  {
    id: "discount-25",
    name: "25 EGP Discount",
    description: "Get 25 EGP off your next order (min. 200 EGP)",
    pointsCost: 2500, // 25 EGP = 2500 points
    value: 25,
    type: "discount",
    available: true,
    terms: [
      "Minimum order value: 200 EGP",
      "Cannot be combined with other offers",
    ],
    expiryDays: 30,
  },
  {
    id: "discount-50",
    name: "50 EGP Discount",
    description: "Get 50 EGP off your next order (min. 300 EGP)",
    pointsCost: 5000, // 50 EGP = 5000 points
    value: 50,
    type: "discount",
    minTier: "silver",
    available: true,
    terms: ["Minimum order value: 300 EGP", "Silver tier and above only"],
    expiryDays: 45,
  },
  {
    id: "discount-100",
    name: "100 EGP Discount",
    description: "Get 100 EGP off your next order (min. 500 EGP)",
    pointsCost: 10000, // 100 EGP = 10000 points
    value: 100,
    type: "discount",
    minTier: "gold",
    available: true,
    terms: ["Minimum order value: 500 EGP", "Gold tier and above only"],
    expiryDays: 60,
  },
  {
    id: "free-delivery-single",
    name: "Free Delivery",
    description: "Free delivery on your next order",
    pointsCost: 1500, // ~15 EGP
    value: 15,
    type: "free_delivery",
    available: true,
    terms: ["Valid for one order only", "Standard delivery fee waived"],
    expiryDays: 30,
  },
  {
    id: "free-delivery-month",
    name: "Free Delivery - 1 Month",
    description: "Free delivery on all orders for 30 days",
    pointsCost: 3000,
    value: 50, // Estimated value
    type: "free_delivery",
    minTier: "silver",
    available: true,
    terms: ["Valid for 30 days from redemption", "Unlimited orders"],
    expiryDays: 30,
  },
  {
    id: "free-item-coffee",
    name: "Free Coffee",
    description: "Free coffee of your choice (up to 30 EGP value)",
    pointsCost: 3000,
    value: 30,
    type: "free_item",
    available: true,
    terms: ["Maximum value: 30 EGP", "Add to cart and apply code at checkout"],
    expiryDays: 30,
  },
  {
    id: "gift-card-100",
    name: "100 EGP Gift Card",
    description: "Gift card worth 100 EGP",
    pointsCost: 10000,
    value: 100,
    type: "gift_card",
    minTier: "silver",
    available: true,
    terms: ["Can be used on any order", "Non-refundable", "Transferable"],
    expiryDays: 90,
  },
  {
    id: "gift-card-250",
    name: "250 EGP Gift Card",
    description: "Gift card worth 250 EGP",
    pointsCost: 25000,
    value: 250,
    type: "gift_card",
    minTier: "gold",
    available: true,
    terms: ["Can be used on any order", "Non-refundable", "Transferable"],
    expiryDays: 90,
  },
  {
    id: "gift-card-500",
    name: "500 EGP Gift Card",
    description: "Gift card worth 500 EGP",
    pointsCost: 50000,
    value: 500,
    type: "gift_card",
    minTier: "platinum",
    available: true,
    terms: ["Can be used on any order", "Non-refundable", "Transferable"],
    expiryDays: 180,
  },
];

// Helper functions
export function getRewardById(rewardId: string): Reward | undefined {
  return REWARDS_CATALOG.find((r) => r.id === rewardId);
}

export function getAvailableRewards(userTier: string): Reward[] {
  const tierOrder = ["bronze", "silver", "gold", "platinum"];
  const userTierIndex = tierOrder.indexOf(userTier);

  return REWARDS_CATALOG.filter((reward) => {
    if (!reward.available) return false;
    if (!reward.minTier) return true;

    const rewardTierIndex = tierOrder.indexOf(reward.minTier);
    return userTierIndex >= rewardTierIndex;
  });
}

export function canUserRedeemReward(
  reward: Reward,
  userPoints: number,
  userTier: string,
): { canRedeem: boolean; reason?: string } {
  if (!reward.available) {
    return { canRedeem: false, reason: "Reward is currently unavailable" };
  }

  if (userPoints < reward.pointsCost) {
    return {
      canRedeem: false,
      reason: `Insufficient points. You need ${reward.pointsCost - userPoints} more points.`,
    };
  }

  if (reward.minTier) {
    const tierOrder = ["bronze", "silver", "gold", "platinum"];
    const userTierIndex = tierOrder.indexOf(userTier);
    const minTierIndex = tierOrder.indexOf(reward.minTier);

    if (userTierIndex < minTierIndex) {
      return {
        canRedeem: false,
        reason: `This reward requires ${reward.minTier} tier or higher.`,
      };
    }
  }

  return { canRedeem: true };
}

export function generateRewardCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "ELITE-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
