# 🌟 ELITE Rewards & Loyalty System

Complete documentation for the ELITE rewards ecosystem with coins, 10-level tiers, avatars, challenges, and streaks.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Coin Economy](#coin-economy)
3. [10-Level Elite Card System](#10-level-elite-card-system)
4. [Earning Coins](#earning-coins)
5. [Challenges System](#challenges-system)
6. [Streak Mechanics](#streak-mechanics)
7. [Avatar System](#avatar-system)
8. [Rewards Shop](#rewards-shop)
9. [API Endpoints](#api-endpoints)
10. [Database Schema](#database-schema)
11. [Admin Operations](#admin-operations)
12. [Formulas & Calculations](#formulas--calculations)

---

## Overview

The ELITE Rewards System is a comprehensive gamification and loyalty platform designed to:
- Increase customer engagement through progressive rewards
- Build long-term loyalty with meaningful progression
- Maintain simplicity while offering depth
- Protect margins through balanced economics
- Keep the focus on food ordering as the primary experience

**Core Philosophy:** Simple, clean, not overwhelming, predictable, and rewarding.

---

## Coin Economy

### Exchange Rate
- **100 Coins = 1 EGP** (redemption value)
- All rewards shop items are priced in coins based on their EGP value × 100

### Earning Rate
- **Base Rate:** 10 coins per 1 EGP spent (before tier multipliers)
- **Example:** 
  - 200 EGP order = 2,000 base coins
  - With 10% tier multiplier = 2,200 coins earned

### Purpose
- High coin counts create psychological value
- Requires real engagement for high-value rewards
- Protects business margins
- Encourages repeat purchases

---

## 10-Level Elite Card System

Progressive tier system with monthly requirements:

| Tier | Multiplier | Monthly Coins | Purchases | Challenges | Elite Challenges | Streak Days | Color | Icon |
|------|-----------|---------------|-----------|------------|------------------|-------------|-------|------|
| **Starter** | 0% | 0 | 0 | - | - | 0 | Gray | 🌟 |
| **Black** | 5% | 1,500 | 2 | - | - | 3 | Black | ⚫ |
| **Silver** | 7% | 3,000 | 3 | 1 | - | 5 | Silver | ⚪ |
| **Gold** | 10% | 6,000 | 4 | 2 | - | 7 | Gold | 🟡 |
| **Platinum** | 12% | 10,000 | 5 | 3 | - | 10 | Purple | 🟣 |
| **Diamond** | 14% | 14,000 | 6 | 4 | - | 12 | Cyan | 💎 |
| **Ruby** | 16% | 20,000 | 7 | 5 | 1 | 15 | Red | 🔴 |
| **Obsidian** | 18% | 26,000 | 8 | 6 | - | 18 | Dark | ⬛ |
| **Elite Black** | 20% | 35,000 | 10 | 8 | - | 20 | Black | 👑 |
| **Founder** | 25% | 50,000 | 12 | 10 | - | 25 | Gold | 👑✨ |

### Tier Benefits

Each tier unlocks cumulative benefits:

**Black (5%):**
- 5% bonus coins on all purchases
- Early access to challenges
- Birthday reward

**Silver (7%):**
- 7% bonus coins
- Free delivery on orders over 200 EGP
- Priority support

**Gold (10%):**
- 10% bonus coins
- Free delivery on all orders
- Exclusive avatars
- Monthly bonus coins

**Platinum (12%):**
- 12% bonus coins
- Double challenge rewards
- VIP support

**Diamond (14%):**
- 14% bonus coins
- Exclusive merchandise access
- VIP events

**Ruby (16%):**
- 16% bonus coins
- Elite challenges access
- Personalized offers

**Obsidian (18%):**
- 18% bonus coins
- Mystery boxes
- Concierge service

**Elite Black (20%):**
- 20% bonus coins
- Private events
- Dedicated account manager

**Founder (25%):**
- 25% bonus coins
- Lifetime perks
- Founder avatar
- Co-creation opportunities
- All exclusive content

### Tier Progression Logic

- **Monthly Requirements:** All requirements must be met each month to maintain/advance tier
- **Evaluation:** Tiers are checked at the start of each month
- **Downgrade:** 
  - Miss requirements = drop 1 tier
  - Miss 2 consecutive months = drop 2 tiers
  - Founder tier = immediate loss if requirements not met

### UX Simplicity

To avoid overwhelming users with 10 tiers:
- Show **current tier + next 2 tiers** prominently
- Hide advanced tiers behind "See All Levels" button
- Use **large progress bars** instead of numbers
- Provide **contextual tips**:
  - "Earn 2,000 more coins to reach Silver"
  - "Complete 1 challenge to unlock Gold"
  - "Maintain a 7-day streak for next tier"

---

## Earning Coins

### 1. Purchases (Primary Source)
```
Base Coins = Order Total (EGP) × 10
Tier Bonus = Base Coins × (Tier Multiplier / 100)
Total Coins = Base Coins + Tier Bonus
```

**Example:**
- Order: 300 EGP
- User Tier: Gold (10%)
- Base: 300 × 10 = 3,000 coins
- Bonus: 3,000 × 0.10 = 300 coins
- **Total: 3,300 coins**

### 2. Challenges
- Normal Challenges: 100-1,000 coins
- Elite Challenges: 1,500-5,000 coins
- Types:
  - Purchase count: "Order 5 times this week"
  - Spend amount: "Spend 500 EGP this month"
  - Category: "Try items from 3 different categories"
  - Specific products: "Order our new seasonal drink"
  - Combo: "Order coffee + pastry in one order"
  - Social: "Share 3 products", "Write 5 reviews"
  - Streak: "Maintain 14-day streak"

### 3. Streaks
Daily streak milestones:
- 3 days: 100 coins
- 7 days: 300 coins
- 14 days: 700 coins
- 21 days: 1,200 coins
- 30 days: 2,000 coins
- 60 days: 5,000 coins
- 90 days: 10,000 coins

Weekly orders:
- 2 orders: 200 coins
- 4 orders: 500 coins
- 7 orders: 1,000 coins

Monthly orders:
- 8 orders: 800 coins
- 15 orders: 2,000 coins
- 25 orders: 4,000 coins

### 4. Social Actions
- Product review (with text): 100 coins
- Product rating (stars only): 50 coins
- Share product/order: 25 coins
- Successful referral: 1,000 coins
- Helpful review vote: 10 coins

### 5. Special Events
- Birthday: 500-1,000 coins
- Anniversary: 1,000 coins
- Holiday promotions: Varies
- Brand milestones: Varies

### 6. Admin Bonuses
- Compensation for issues
- VIP rewards
- Contest prizes
- Special promotions

---

## Challenges System

### Challenge Types

**Purchase-Based:**
- `purchase_count`: Complete X orders
- `spend_amount`: Spend X EGP total
- `product_category`: Order from X categories
- `specific_products`: Order specific items
- `combo`: Order multiple items in one order

**Social:**
- `review`: Write X reviews
- `rating`: Rate X products
- `share`: Share X items

**Engagement:**
- `streak`: Maintain X-day streak
- `referral`: Refer X friends

### Challenge Structure

```json
{
  "title": "Coffee Lover",
  "description": "Order 5 coffee drinks this month",
  "type": "specific_products",
  "tier": "normal",
  "requirement": {
    "type": "specific_products",
    "productIds": ["prod-1", "prod-2", "prod-3"],
    "target": 5
  },
  "coinsReward": 500,
  "avatarUnlock": "avatar-coffee-lover",
  "isRecurring": true,
  "recurringPeriod": "monthly"
}
```

### Progress Tracking

All challenge progress is automatically tracked:
- Order completions update purchase challenges
- Social actions update engagement challenges
- Streaks update streak challenges

Users can view real-time progress for each challenge.

---

## Streak Mechanics

### Daily Streak
- Increments by 1 for each consecutive day with an order
- Breaks if no order for >24 hours
- Tracks `currentDaily` and `longestDaily`

### Weekly/Monthly Counters
- Resets every week/month
- Tracks order count within period
- Awards coins at specific thresholds

### Streak Protection (Future Feature)
- Use coins to "freeze" streak for a day
- Automatic insurance option for high-tier users

---

## Avatar System

### Avatar Types

**Unlock Methods:**
- `tier`: Unlocks at specific tier (e.g., "Gold avatar")
- `challenge`: Unlocks by completing challenge
- `coins`: Purchase with coins (500-5,000 coins)
- `seasonal`: Available during specific dates
- `special`: Admin-granted or event-exclusive

### Rarity Levels
- **Common:** Default avatars
- **Rare:** Requires moderate effort
- **Epic:** Significant achievement
- **Legendary:** Top-tier exclusives

### Avatar Features
- Profile customization
- Social recognition
- Collection mechanics
- Limited-time exclusives

---

## Rewards Shop

### Item Categories

**Merchandise:**
- T-shirts, hoodies, caps
- Mugs, tumblers, water bottles
- Tote bags, stickers
- Price: 20,000-50,000 coins

**Food & Drinks:**
- Free items (any menu item up to X EGP)
- Meal combos
- Price: 300-3,000 coins

**Discounts:**
- 10% off next order: 500 coins
- 50 EGP voucher: 5,000 coins
- Free delivery vouchers: 300 coins

**Digital:**
- Exclusive avatars: 1,000-5,000 coins
- Profile themes: 500-2,000 coins

**Special:**
- Mystery boxes: 5,000 coins
- VIP experiences: 30,000+ coins

### Pricing Formula
```
Coins Cost = EGP Value × 100
```

**Example:**
- Mug worth 400 EGP = **40,000 coins**
- Free 50 EGP item = **5,000 coins**

### Stock & Limits
- Items can have limited stock
- Max redemptions per user (e.g., 1 hoodie per month)
- Seasonal exclusives

---

## API Endpoints

### User Endpoints

#### GET `/api/loyalty`
Get comprehensive loyalty information
- Account (coins, tier, multiplier)
- Tier progress
- Streak status
- Recent activity

#### GET `/api/loyalty/coins`
Get coin balance and transaction history
- Query params: `limit`, `offset`

#### GET `/api/loyalty/tiers`
Get tier information and progress
- Current tier config
- Next tier requirements
- Progress breakdown

#### POST `/api/loyalty/tiers/check`
Manually trigger tier evaluation (or via cron)

#### GET `/api/loyalty/challenges`
Get active challenges with user progress
- Separated into normal and elite

#### GET `/api/loyalty/streaks`
Get streak status and milestones
- Daily, weekly, monthly tracking
- Next milestone info

#### GET `/api/loyalty/avatars`
Get available and unlocked avatars
- Categorized by rarity and unlock status

#### POST `/api/loyalty/avatars`
Equip or unlock an avatar
- Actions: `equip`, `unlock`

#### GET `/api/loyalty/rewards`
Get rewards shop items
- Query params: `type`, `category`
- Shows affordability and availability

#### POST `/api/loyalty/rewards`
Redeem a reward
- Deducts coins
- Creates redemption record

#### GET `/api/loyalty/social`
Get social action rewards info

#### POST `/api/loyalty/social`
Award coins for social action
- Actions: `review`, `rating`, `share`, `referral`

### Admin Endpoints

#### GET/POST `/api/admin/loyalty/challenges`
Manage challenges
- Create, list, update challenges

#### GET/POST `/api/admin/loyalty/rewards`
Manage reward items
- Create, list, update shop items

#### GET/POST `/api/admin/loyalty/avatars`
Manage avatars
- Create, list, update avatars

#### POST `/api/admin/loyalty/coins`
Award bonus coins to users
- Admin-initiated coin grants

---

## Database Schema

### Key Models

**LoyaltyAccount**
- `coins`: Current balance
- `lifetimeCoins`: Total earned ever
- `tier`: Current tier (starter → founder)
- `tierMultiplier`: Percentage bonus (0-25)
- `totalSpent`: Lifetime spending

**LoyaltyLedger**
- Transaction log for all coin movements
- `deltaCoins`: Amount (positive or negative)
- `source`: order, challenge, streak, social, admin, redemption
- `metadata`: Additional context

**MonthlyTierProgress**
- Tracks monthly requirements
- `coinsEarned`, `purchaseCount`, `challengesComplete`
- `maxStreakDays`, `meetsRequirements`
- Resets monthly

**UserStreak**
- `currentDaily`, `longestDaily`
- `weeklyCount`, `monthlyCount`
- `lastActivityDate`

**Challenge**
- Challenge definition
- `type`, `tier`, `requirement`, `coinsReward`
- `isRecurring`, `recurringPeriod`

**ChallengeCompletion**
- User progress on challenges
- `progress` (JSON), `completedAt`

**Avatar**
- Avatar definition
- `unlockType`, `unlockValue`, `rarity`

**UserAvatar**
- User-avatar relationship
- `isEquipped` flag

**RewardItem**
- Shop item definition
- `coinsCost`, `stockQty`, `maxPerUser`

**RewardRedemption**
- Redemption history
- `status`, `deliveryMethod`, `trackingInfo`

**SocialAction**
- Social engagement tracking
- `actionType`, `coinsAwarded`

---

## Admin Operations

### Managing Challenges

Create challenges through admin API:
```json
{
  "title": "Weekend Warrior",
  "description": "Order 3 times this weekend",
  "type": "purchase_count",
  "tier": "normal",
  "requirement": {
    "type": "purchase_count",
    "target": 3
  },
  "coinsReward": 400,
  "isRecurring": true,
  "recurringPeriod": "weekly",
  "priority": 10
}
```

### Managing Rewards Shop

Add items:
```json
{
  "name": "ELITE Coffee Mug",
  "description": "Premium ceramic mug with ELITE logo",
  "type": "merch",
  "coinsCost": 40000,
  "egpValue": 400,
  "imageUrl": "/images/mug.jpg",
  "stockQty": 50,
  "maxPerUser": 2,
  "category": "drinkware"
}
```

### Awarding Bonus Coins

Manually grant coins:
```json
{
  "userId": "user-123",
  "coins": 5000,
  "reason": "Compensation for delivery issue"
}
```

### Monthly Tier Checks

Run tier evaluation (cron job):
```bash
POST /api/loyalty/tiers/check
```

Should be scheduled at start of each month to:
- Evaluate all users against requirements
- Upgrade/downgrade tiers
- Reset monthly progress

---

## Formulas & Calculations

### Coin Earnings from Purchase
```typescript
function calculatePurchaseCoins(amountEGP: number, tierMultiplier: number): number {
  const baseCoins = Math.floor(amountEGP * 10);
  const multiplierBonus = Math.floor(baseCoins * (tierMultiplier / 100));
  return baseCoins + multiplierBonus;
}
```

### Tier Progress Calculation
```typescript
function calculateTierProgress(
  currentProgress: MonthlyProgress,
  nextTierRequirements: TierRequirements
): Progress {
  const coinsProgress = (currentProgress.coinsEarned / nextTierRequirements.coinsEarned) * 100;
  const purchasesProgress = (currentProgress.purchaseCount / nextTierRequirements.purchases) * 100;
  const challengesProgress = (currentProgress.challengesComplete / nextTierRequirements.challenges) * 100;
  const streakProgress = (currentProgress.maxStreakDays / nextTierRequirements.streakDays) * 100;
  
  return {
    coinsProgress: Math.min(100, coinsProgress),
    purchasesProgress: Math.min(100, purchasesProgress),
    challengesProgress: Math.min(100, challengesProgress),
    streakProgress: Math.min(100, streakProgress),
    overallProgress: (coinsProgress + purchasesProgress + challengesProgress + streakProgress) / 4,
  };
}
```

### Tier Qualification Check
```typescript
function qualifiesForTier(progress: MonthlyProgress, tier: TierConfig): boolean {
  return (
    progress.coinsEarned >= tier.monthlyRequirements.coinsEarned &&
    progress.purchaseCount >= tier.monthlyRequirements.purchases &&
    progress.challengesComplete >= (tier.monthlyRequirements.challenges || 0) &&
    progress.eliteChallengesComplete >= (tier.monthlyRequirements.eliteChallenges || 0) &&
    progress.maxStreakDays >= tier.monthlyRequirements.streakDays
  );
}
```

### Streak Calculation
```typescript
function updateStreak(lastActivityDate: Date, todayDate: Date): number {
  const daysDiff = Math.floor((todayDate.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 1) {
    return currentStreak + 1; // Continue streak
  } else if (daysDiff > 1) {
    return 1; // Reset streak
  } else {
    return currentStreak; // Same day
  }
}
```

---

## Implementation Notes

### Automatic Triggers

**On Order Completion:**
1. Award coins based on order total + tier multiplier
2. Update streak
3. Update monthly progress (coins, purchase count)
4. Track challenge progress
5. Check tier qualification

**On Social Action:**
1. Award coins for action
2. Track challenge progress
3. Prevent duplicate rewards

**Monthly Cron Job:**
1. Evaluate all users for tier updates
2. Reset monthly progress
3. Reset recurring challenges
4. Award monthly bonuses

### Performance Considerations

- Use database transactions for coin operations
- Index frequently queried fields (userId, createdAt, source)
- Cache tier configurations
- Batch process monthly evaluations

### Future Enhancements

1. **Leaderboards:** Top earners, longest streaks
2. **Teams:** Compete with friends
3. **Seasonal Events:** Limited-time mega challenges
4. **NFT Rewards:** Blockchain-based collectibles
5. **Predictive Offers:** AI-driven personalized challenges
6. **Gamification API:** Webhooks for third-party integrations

---

## Support & Maintenance

### Monitoring

Track key metrics:
- Average coins earned per user per month
- Tier distribution (% in each tier)
- Redemption rate
- Challenge completion rate
- Streak retention

### Balancing

Regularly review:
- Are coins too easy/hard to earn?
- Are tier requirements achievable?
- Are rewards desirable?
- Is progression satisfying?

### User Feedback

Collect feedback on:
- Clarity of requirements
- Fairness of progression
- Desirability of rewards
- UX simplicity

---

## Conclusion

The ELITE Rewards System balances:
- **Depth:** 10 tiers, challenges, streaks, avatars
- **Simplicity:** Clear UI, predictable mechanics
- **Engagement:** Multiple earn sources, varied rewards
- **Economics:** Protected margins, balanced earn rates
- **Focus:** Enhances, doesn't distract from ordering

This creates a sustainable loyalty ecosystem that drives repeat business while maintaining a premium brand experience.

---

**Version:** 1.0  
**Last Updated:** 2024  
**Contact:** Dev Team
