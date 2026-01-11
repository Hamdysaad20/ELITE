// Notification types for the analytics system
export type NotificationType =
  | "tier_upgrade"
  | "points_earned"
  | "points_expiring"
  | "milestone_reached"
  | "savings_milestone";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

export interface TierUpgradeNotification {
  previousTier: string;
  newTier: string;
  pointsEarned: number;
  benefits: string[];
}

export interface PointsEarnedNotification {
  points: number;
  orderId: string;
  reason: string;
}

export interface MilestoneNotification {
  milestone: string;
  value: number;
  reward?: string;
}
