# 🌟 ELITE Rewards System - Quick Start Guide

Complete implementation of the ELITE rewards and loyalty system with coins, 10-level tiers, avatars, challenges, and streaks.

---

## 🚀 Quick Start

### 1. Database Setup

Generate and run the Prisma migration:

```bash
# Generate Prisma client
npm run prisma:generate

# Create migration
npx prisma migrate dev --name elite_rewards_system

# Apply migration to production
npx prisma migrate deploy
```

### 2. Seed Initial Data

Populate challenges, avatars, and rewards:

```bash
npm run loyalty:seed
```

This creates:
- 10 challenges (normal and elite)
- 12 avatars (common to legendary)
- 13 reward shop items (food, merch, discounts)

### 3. Migrate Existing Data (Optional)

If upgrading from old loyalty system:

```bash
npm run loyalty:migrate
```

Converts:
- Points → Coins (× 100)
- Old tiers → New tiers
- Creates monthly progress records
- Initializes streaks
- Grants 1,000 welcome bonus

---

## 📂 Project Structure

```
src/server/services/
├── eliteLoyalty.ts          # Core loyalty logic (coins, tiers, calculations)
├── challengeService.ts      # Challenge tracking and completion
└── loyalty.ts               # Backwards-compatible wrappers

src/app/api/loyalty/
├── route.ts                 # Main loyalty endpoint
├── coins/route.ts           # Coin balance and history
├── tiers/route.ts           # Tier status and progress
├── challenges/route.ts      # Active challenges
├── streaks/route.ts         # Streak tracking
├── avatars/route.ts         # Avatar management
├── rewards/route.ts         # Rewards shop
└── social/route.ts          # Social actions

src/app/api/admin/loyalty/
├── challenges/route.ts      # Admin challenge management
├── rewards/route.ts         # Admin rewards management
├── avatars/route.ts         # Admin avatar management
└── coins/route.ts           # Admin coin grants

scripts/
├── seed-elite-rewards.ts    # Initial data seeding
├── migrate-loyalty-data.ts  # Data migration script
├── monthly-tier-check.ts    # Monthly tier evaluation
└── weekly-challenge-reset.ts # Weekly challenge reset

docs/
├── ELITE_REWARDS_SYSTEM.md   # Complete system documentation
├── ELITE_REWARDS_MIGRATION.md # Migration guide
└── ELITE_REWARDS_README.md    # This file
```

---

## 🎯 Key Concepts

### Coin Economy
- **100 coins = 1 EGP** (redemption value)
- **Earn:** 10 coins per 1 EGP spent (+ tier bonus)
- **Example:** 200 EGP order = 2,000 base coins

### 10-Level Tier System
- Starter (0%) → Black (5%) → Silver (7%) → Gold (10%) → Platinum (12%)
- Diamond (14%) → Ruby (16%) → Obsidian (18%) → Elite Black (20%) → Founder (25%)
- Monthly requirements: coins, purchases, challenges, streaks

### Earning Sources
1. **Purchases** - Primary source (10 coins/EGP + tier bonus)
2. **Challenges** - 100-5,000 coins
3. **Streaks** - Daily/weekly/monthly milestones
4. **Social** - Reviews (100), ratings (50), shares (25), referrals (1,000)
5. **Events** - Seasonal bonuses
6. **Admin** - Manual grants

---

## 🔌 API Usage

### Get User Loyalty Info
```typescript
GET /api/loyalty

Response:
{
  "success": true,
  "data": {
    "account": {
      "coins": 25000,
      "lifetimeCoins": 30000,
      "tier": "black",
      "tierMultiplier": 5
    },
    "tier": { current, next, progress },
    "streak": { currentDaily, longestDaily },
    "monthlyProgress": { ... },
    "recentActivity": [ ... ]
  }
}
```

### Get Coin Balance
```typescript
GET /api/loyalty/coins?limit=20&offset=0

Response:
{
  "success": true,
  "data": {
    "balance": 25000,
    "lifetimeCoins": 30000,
    "coinsValueEGP": "250.00",
    "history": [ ... ],
    "pagination": { ... }
  }
}
```

### Get Active Challenges
```typescript
GET /api/loyalty/challenges

Response:
{
  "success": true,
  "data": {
    "normal": [ { id, title, description, coinsReward, progress, isCompleted } ],
    "elite": [ ... ],
    "totalActive": 10,
    "completedCount": 2
  }
}
```

### Redeem Reward
```typescript
POST /api/loyalty/rewards
{
  "rewardItemId": "reward-free-coffee",
  "deliveryMethod": "pickup",
  "notes": "Large size please"
}

Response:
{
  "success": true,
  "data": {
    "redemption": { id, coinsSpent, status },
    "message": "Reward redeemed successfully"
  }
}
```

### Award Social Coins
```typescript
POST /api/loyalty/social
{
  "actionType": "review",
  "targetId": "product-123",
  "metadata": { rating: 5, comment: "Great coffee!" }
}

Response:
{
  "success": true,
  "data": {
    "coinsAwarded": 100,
    "message": "Earned 100 coins for review"
  }
}
```

---

## 🛠️ Admin Operations

### Create Challenge
```typescript
POST /api/admin/loyalty/challenges
{
  "title": "Weekend Warrior",
  "description": "Order 3 times this weekend",
  "type": "purchase_count",
  "tier": "normal",
  "requirement": { type: "purchase_count", target: 3 },
  "coinsReward": 400,
  "isRecurring": true,
  "recurringPeriod": "weekly"
}
```

### Create Reward Item
```typescript
POST /api/admin/loyalty/rewards
{
  "name": "ELITE Coffee Mug",
  "description": "Premium ceramic mug",
  "type": "merch",
  "coinsCost": 40000,
  "egpValue": 400,
  "stockQty": 50,
  "maxPerUser": 2
}
```

### Grant Bonus Coins
```typescript
POST /api/admin/loyalty/coins
{
  "userId": "user-123",
  "coins": 5000,
  "reason": "Compensation for delivery issue"
}
```

---

## ⏰ Scheduled Tasks

### Monthly Tier Check (Run on 1st of each month)
```bash
npm run loyalty:tier-check
```

Actions:
- Evaluates all users against tier requirements
- Upgrades/downgrades tiers
- Resets monthly progress
- Resets monthly challenges

### Weekly Challenge Reset (Run on Mondays)
```bash
npm run loyalty:weekly-reset
```

Actions:
- Resets weekly recurring challenges
- Resets weekly order counters

### Cron Setup (Linux/Mac)
```bash
# Edit crontab
crontab -e

# Add lines:
# Monthly tier check (1st of month at 2 AM)
0 2 1 * * cd /path/to/project && npm run loyalty:tier-check

# Weekly reset (Every Monday at 2 AM)
0 2 * * 1 cd /path/to/project && npm run loyalty:weekly-reset
```

---

## 🧪 Testing

### Test Order Coins
```typescript
// Place order → Complete order
// Check coins awarded:
GET /api/loyalty/coins

// Should see ledger entry with:
// - deltaCoins = (orderTotal × 10) × (1 + tierMultiplier/100)
// - source = "order"
```

### Test Challenge Completion
```typescript
// Complete challenge requirements
// Check challenge status:
GET /api/loyalty/challenges

// Should see:
// - progress.completed = true
// - completedAt timestamp
```

### Test Tier Progression
```typescript
// Meet all monthly requirements
// Run tier check:
POST /api/loyalty/tiers/check

// Check updated tier:
GET /api/loyalty/tiers
```

---

## 📊 Monitoring

### Key Metrics Dashboard

Track these metrics:
- **Coin Metrics:**
  - Total coins in circulation
  - Average coins per user
  - Coins earned per day
  - Coins redeemed per day

- **Tier Distribution:**
  - % users in each tier
  - Tier upgrades per month
  - Tier downgrades per month

- **Engagement:**
  - Challenge completion rate
  - Streak retention (7-day, 30-day)
  - Reward redemption rate
  - Social action rate

- **Performance:**
  - API response times
  - Error rates
  - Database query performance

### Database Queries

```sql
-- Total coins in circulation
SELECT SUM(coins) FROM "LoyaltyAccount";

-- Tier distribution
SELECT tier, COUNT(*) FROM "LoyaltyAccount" GROUP BY tier;

-- Top earners this month
SELECT userId, coinsEarned FROM "MonthlyTierProgress"
WHERE year = 2024 AND month = 12
ORDER BY coinsEarned DESC LIMIT 10;

-- Challenge completion rates
SELECT c.title, COUNT(cc.id) as completions
FROM "Challenge" c
LEFT JOIN "ChallengeCompletion" cc ON c.id = cc.challengeId AND cc.completedAt IS NOT NULL
GROUP BY c.id, c.title;
```

---

## 🔧 Configuration

### Environment Variables

Add to `.env`:
```env
# Already configured:
DATABASE_URL="postgresql://..."

# Optional:
LOYALTY_WELCOME_BONUS=1000
LOYALTY_REFERRAL_BONUS=1000
LOYALTY_STREAK_PROTECTION_COINS=500
```

### Customization

Edit constants in `src/server/services/eliteLoyalty.ts`:

```typescript
// Adjust coin earn rate
export const BASE_COINS_PER_EGP_SPENT = 10; // Change to 5, 15, etc.

// Adjust tier requirements
export const ELITE_TIERS = {
  black: {
    multiplier: 5,
    monthlyRequirements: {
      coinsEarned: 1500, // Adjust this
      purchases: 2,      // Adjust this
      streakDays: 3      // Adjust this
    }
  },
  // ...
}

// Adjust streak rewards
export const STREAK_REWARDS = {
  daily: [
    { days: 3, coins: 100 },  // Adjust coins
    { days: 7, coins: 300 },  // Adjust coins
    // ...
  ]
}
```

---

## 🐛 Troubleshooting

### Issue: Coins not awarded for order

**Check:**
1. Order status is `DELIVERED` or `COMPLETED`
2. User is authenticated
3. No duplicate ledger entry exists
4. Loyalty account exists

**Solution:**
```typescript
// Manually award coins:
POST /api/admin/loyalty/coins
{ "userId": "...", "coins": 2000, "reason": "Manual order coins" }
```

### Issue: Tier not updating

**Check:**
1. Monthly progress record exists
2. Requirements are met
3. `lastTierCheck` date

**Solution:**
```bash
# Force tier check
npm run loyalty:tier-check
```

### Issue: Challenge not completing

**Check:**
1. Challenge is active
2. Requirements match activity
3. Progress tracking

**Solution:**
- Check challenge requirement JSON
- Verify challenge type is being tracked
- Check `ChallengeCompletion` progress field

---

## 📚 Additional Resources

- **Full Documentation:** `docs/ELITE_REWARDS_SYSTEM.md`
- **Migration Guide:** `docs/ELITE_REWARDS_MIGRATION.md`
- **API Reference:** See individual route files
- **Database Schema:** `prisma/schema.prisma`

---

## 🤝 Contributing

When adding features:
1. Update tier configs in `eliteLoyalty.ts`
2. Add API endpoints under `/api/loyalty/`
3. Update documentation
4. Add tests
5. Update seed data if needed

---

## 📞 Support

- **Technical:** Check logs in `/logs`
- **Database:** Check Prisma Studio: `npx prisma studio`
- **API:** Test with Postman/Insomnia
- **Issues:** Check GitHub issues

---

## ✅ Checklist for Go-Live

- [ ] Database migration completed
- [ ] Initial data seeded
- [ ] Old data migrated (if applicable)
- [ ] Cron jobs scheduled
- [ ] API endpoints tested
- [ ] Admin panel configured
- [ ] Monitoring set up
- [ ] Documentation reviewed
- [ ] Support team trained
- [ ] User communication sent

---

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** Production Ready 🚀
