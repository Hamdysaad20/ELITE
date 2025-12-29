# Phase 4: Gamification System - Scalable Architecture

**Status:** 🏗️ Design Phase  
**Date:** December 2024

---

## Executive Summary

This document outlines a **scalable gamification architecture** that integrates with the existing loyalty/points system and supports **multiple rewards for the same action**. The system is designed to be extensible, allowing new reward types and achievements to be added without major refactoring.

---

## Core Principles

### 1. **Multiple Rewards Per Action**
A single user action (e.g., "Purchase Monday Morning Deal") can trigger:
- ✅ Points (loyalty points)
- ✅ Badge progress (e.g., "Morning Legend" badge)
- ✅ Streak increment (e.g., "Deal Hunter" streak)
- ✅ Achievement unlock (e.g., "First Deal Purchase")
- ✅ Tier upgrade (e.g., Bronze → Silver)
- ✅ Special rewards (e.g., "Free Coffee" coupon)

### 2. **Unified Reward Engine**
All rewards flow through a single, extensible reward engine that:
- Tracks which rewards have been awarded (prevents duplicates)
- Supports conditional rewards (e.g., "Only if user has profile complete")
- Handles reward dependencies (e.g., "Badge requires 5 purchases")
- Logs all reward events for analytics

### 3. **Scalable Data Model**
The database schema supports:
- Multiple reward types (points, badges, streaks, achievements, coupons)
- Reward rules and conditions
- User progress tracking
- Reward history and audit trail

---

## Database Schema

### New Tables

```prisma
// Achievement definitions (master data)
model Achievement {
  id            String   @id @default(uuid())
  code          String   @unique // e.g., "morning-legend", "combo-master"
  name          String   // Display name
  description   String   // What user needs to do
  category      String   // "deal", "streak", "social", "milestone"
  icon          String?  // Icon URL or emoji
  tier          String   @default("bronze") // bronze, silver, gold, platinum
  
  // Requirements
  requirementType String // "count", "streak", "value", "custom"
  requirementValue Int   // e.g., 5 purchases, 7-day streak
  requirementData Json? // Custom requirement logic
  
  // Rewards (multiple rewards per achievement)
  rewards       AchievementReward[]
  
  // Progress tracking
  userProgress  UserAchievement[]
  
  isActive      Boolean  @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([code])
  @@index([category])
  @@index([isActive])
}

// Reward definitions (what user gets)
model AchievementReward {
  id            String   @id @default(uuid())
  achievementId String
  achievement   Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)
  
  rewardType    String   // "points", "badge", "coupon", "tier_upgrade", "discount", "custom"
  rewardValue   Json     // Flexible: { points: 100 }, { discount: 10 }, { coupon: "FREE_COFFEE" }
  rewardName    String   // Display name
  
  priority      Int      @default(0) // Order of application
  isActive      Boolean  @default(true)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([achievementId])
  @@index([rewardType])
}

// User achievement progress
model UserAchievement {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievementId String
  achievement   Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)
  
  progress      Int      @default(0) // Current progress (e.g., 3 out of 5)
  target        Int      // Target value (from achievement.requirementValue)
  isCompleted   Boolean  @default(false)
  completedAt   DateTime?
  
  // Reward tracking (prevents duplicate rewards)
  rewardsAwarded Json    @default("[]") // Array of reward IDs that were awarded
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([userId, achievementId])
  @@index([userId])
  @@index([achievementId])
  @@index([isCompleted])
}

// Streak tracking
model UserStreak {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  streakType    String   // "deal_purchase", "daily_checkin", "combo_purchase", "custom"
  currentStreak Int      @default(0)
  longestStreak Int      @default(0)
  lastActivityAt DateTime?
  
  // Grace period (hours) - allows user to maintain streak if slightly late
  gracePeriodHours Int   @default(4)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([userId, streakType])
  @@index([userId])
  @@index([streakType])
}

// Reward events (audit trail)
model RewardEvent {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Trigger
  triggerType   String   // "order_completed", "deal_purchased", "achievement_unlocked", "manual"
  triggerId     String?  // Order ID, Deal ID, Achievement ID, etc.
  triggerData   Json?    // Additional context
  
  // Rewards awarded
  rewards       Json     // Array of { type, value, name, awardedAt }
  
  // Status
  status        String   @default("pending") // pending, awarded, failed, cancelled
  errorMessage  String?
  
  createdAt     DateTime @default(now())
  processedAt   DateTime?
  
  @@index([userId])
  @@index([triggerType])
  @@index([status])
  @@index([createdAt])
}

// Badge definitions (visual achievements)
model Badge {
  id            String   @id @default(uuid())
  code          String   @unique
  name          String
  description   String
  icon          String   // Icon URL or emoji
  category      String   // "deal", "streak", "social", "milestone"
  rarity        String   @default("common") // common, rare, epic, legendary
  
  // How to unlock
  unlockType    String   // "achievement", "streak", "manual", "custom"
  unlockData    Json?    // e.g., { achievementId: "xxx" } or { streakType: "deal_purchase", days: 7 }
  
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([code])
  @@index([category])
  @@index([rarity])
}

// User badges (unlocked badges)
model UserBadge {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  badgeId       String
  badge         Badge    @relation(fields: [badgeId], references: [id], onDelete: Cascade)
  
  unlockedAt    DateTime @default(now())
  isDisplayed    Boolean  @default(true) // Show on profile
  
  @@unique([userId, badgeId])
  @@index([userId])
  @@index([badgeId])
  @@index([unlockedAt])
}
```

### Updated User Model

```prisma
model User {
  // ... existing fields ...
  
  // Gamification relations
  achievements   UserAchievement[]
  streaks       UserStreak[]
  badges         UserBadge[]
  rewardEvents   RewardEvent[]
}
```

---

## Reward Engine Architecture

### Core Service: `RewardEngine`

```typescript
// src/server/services/gamification/rewardEngine.ts

interface RewardTrigger {
  type: string; // "order_completed", "deal_purchased", "achievement_unlocked"
  userId: string;
  triggerId?: string; // Order ID, Deal ID, etc.
  data?: Record<string, any>; // Additional context
}

interface Reward {
  type: "points" | "badge" | "streak" | "achievement" | "coupon" | "tier_upgrade" | "discount";
  value: any; // Flexible value based on type
  name: string;
  priority?: number;
}

interface RewardResult {
  success: boolean;
  rewards: Reward[];
  errors?: string[];
}

class RewardEngine {
  /**
   * Process a trigger and award all applicable rewards
   */
  async processTrigger(trigger: RewardTrigger): Promise<RewardResult> {
    // 1. Find all applicable achievements/rules
    // 2. Check conditions (e.g., user profile complete, cooling period)
    // 3. Award rewards (points, badges, streaks, etc.)
    // 4. Log reward events
    // 5. Return result
  }
  
  /**
   * Award points (integrates with existing loyalty system)
   */
  private async awardPoints(userId: string, points: number, reason: string): Promise<boolean> {
    // Use existing addBonusPoints() from loyalty service
  }
  
  /**
   * Award badge
   */
  private async awardBadge(userId: string, badgeCode: string): Promise<boolean> {
    // Check if already unlocked
    // Unlock badge
    // Log reward event
  }
  
  /**
   * Increment streak
   */
  private async incrementStreak(userId: string, streakType: string): Promise<boolean> {
    // Check grace period
    // Increment or reset streak
    // Check for streak milestones (e.g., 7-day streak badge)
  }
  
  /**
   * Update achievement progress
   */
  private async updateAchievement(userId: string, achievementCode: string, increment: number = 1): Promise<boolean> {
    // Update progress
    // Check if completed
    // If completed, award all rewards from AchievementReward
  }
}
```

---

## Integration with Existing Systems

### 1. **Points System Integration**

The reward engine integrates with **both** existing points systems:

```typescript
// src/server/services/gamification/pointsIntegration.ts

import { addBonusPoints } from "@/server/services/loyalty";
import { updateUserPoints } from "@/lib/analytics/points";

export async function awardPointsReward(
  userId: string,
  points: number,
  reason: string,
  system: "loyalty" | "analytics" | "both" = "both"
): Promise<boolean> {
  const results = await Promise.allSettled([
    system === "loyalty" || system === "both"
      ? addBonusPoints(userId, points, reason)
      : Promise.resolve(true),
    system === "analytics" || system === "both"
      ? updateUserPoints(userId, points, "earn", undefined, reason)
      : Promise.resolve(true),
  ]);
  
  return results.every(r => r.status === "fulfilled");
}
```

### 2. **Deal Purchase Integration**

When a user purchases a deal, multiple rewards can be triggered:

```typescript
// src/server/services/gamification/dealRewards.ts

export async function processDealPurchaseRewards(
  userId: string,
  orderId: string,
  dealType: string, // "Monday Morning Deals", "Happy Hour Deals", etc.
  dealProducts: string[] // Product IDs
): Promise<RewardResult> {
  const engine = new RewardEngine();
  
  // Trigger 1: Deal purchase achievement
  await engine.processTrigger({
    type: "deal_purchased",
    userId,
    triggerId: orderId,
    data: { dealType, products: dealProducts },
  });
  
  // Trigger 2: Specific deal type achievement (e.g., "Monday Morning Legend")
  await engine.processTrigger({
    type: "deal_type_purchased",
    userId,
    triggerId: dealType,
    data: { orderId },
  });
  
  // Trigger 3: Streak increment
  await engine.processTrigger({
    type: "deal_streak",
    userId,
    triggerId: orderId,
    data: { dealType },
  });
  
  // Trigger 4: Combo purchase (if applicable)
  if (dealProducts.length > 1) {
    await engine.processTrigger({
      type: "combo_purchased",
      userId,
      triggerId: orderId,
      data: { products: dealProducts },
    });
  }
  
  return { success: true, rewards: [] };
}
```

---

## Example: "Morning Legend" Achievement

### Achievement Definition

```json
{
  "code": "morning-legend",
  "name": "Morning Legend",
  "description": "Purchase 5 Monday Morning Deals",
  "category": "deal",
  "tier": "silver",
  "requirementType": "count",
  "requirementValue": 5,
  "requirementData": {
    "dealType": "Monday Morning Deals"
  },
  "rewards": [
    {
      "type": "points",
      "value": { "points": 500 },
      "name": "500 Bonus Points",
      "priority": 1
    },
    {
      "type": "badge",
      "value": { "badgeCode": "morning-legend-badge" },
      "name": "Morning Legend Badge",
      "priority": 2
    },
    {
      "type": "discount",
      "value": { "percentage": 5, "category": "Coffee", "permanent": true },
      "name": "Permanent 5% off Coffee",
      "priority": 3
    }
  ]
}
```

### User Progress

When user purchases their 5th Monday Morning Deal:

1. **Update Progress**: `UserAchievement.progress = 5` (was 4)
2. **Check Completion**: `progress >= target` → `isCompleted = true`
3. **Award Rewards** (in priority order):
   - ✅ 500 points (via `addBonusPoints()`)
   - ✅ Unlock "Morning Legend Badge"
   - ✅ Apply permanent 5% discount on Coffee category
4. **Log Event**: Create `RewardEvent` with all rewards
5. **Notification**: Send notification to user

---

## Scalability Features

### 1. **Reward Rules Engine**

Rewards can have conditions:

```typescript
interface RewardRule {
  condition: "profile_complete" | "tier_min" | "cooling_period" | "custom";
  value: any;
  operator?: "equals" | "greater_than" | "less_than" | "in";
}

// Example: "We Miss You" deal (re-engagement)
{
  "code": "we-miss-you",
  "rewards": [{
    "type": "discount",
    "value": { "percentage": 20 },
    "rules": [{
      "condition": "cooling_period",
      "value": 60, // days
      "operator": "greater_than"
    }]
  }]
}
```

### 2. **Custom Reward Types**

New reward types can be added without schema changes:

```typescript
// Example: Physical reward
{
  "type": "physical_reward",
  "value": {
    "rewardCode": "ELITE_MUG",
    "shippingRequired": true
  }
}

// Example: VIP access
{
  "type": "vip_access",
  "value": {
    "eventId": "elite-anniversary-2025",
    "accessLevel": "VIP"
  }
}
```

### 3. **A/B Testing Support**

Rewards can have variants for testing:

```typescript
interface RewardVariant {
  variantId: string;
  percentage: number; // 50% of users get this variant
  rewards: Reward[];
}
```

---

## API Endpoints

### 1. **GET /api/gamification/achievements**
Get user's achievements and progress

### 2. **GET /api/gamification/streaks**
Get user's streaks

### 3. **GET /api/gamification/badges**
Get user's unlocked badges

### 4. **POST /api/gamification/process-reward**
Manually trigger reward processing (admin only)

### 5. **GET /api/gamification/reward-history**
Get user's reward history

---

## Implementation Phases

### Phase 4.1: Core Infrastructure (Week 1)
- ✅ Database schema migration
- ✅ RewardEngine service
- ✅ Integration with existing points systems
- ✅ Basic achievement tracking

### Phase 4.2: Deal-Based Achievements (Week 2)
- ✅ "Morning Legend" achievement
- ✅ "Combo Master" achievement
- ✅ Deal purchase tracking
- ✅ Streak system

### Phase 4.3: Badge System (Week 3)
- ✅ Badge definitions
- ✅ Badge unlock logic
- ✅ Badge display on profile
- ✅ Badge notifications

### Phase 4.4: Advanced Features (Week 4)
- ✅ Cooling periods
- ✅ Reward rules engine
- ✅ A/B testing support
- ✅ Analytics dashboard

---

## Next Steps

1. **Review and approve** this architecture
2. **Create database migration** for new tables
3. **Implement RewardEngine** service
4. **Integrate with deal purchase flow**
5. **Build frontend components** for achievements/badges

---

**✅ Ready for Implementation**

