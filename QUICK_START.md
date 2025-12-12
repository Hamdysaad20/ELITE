# ELITE Rewards System - Quick Start Guide

## 🚀 For Developers

### Test the Implementation

```bash
# Run comprehensive tests
npx tsx ./scripts/test-elite-rewards.ts  # Requires DATABASE_URL
npx tsx ./scripts/test-elite-api.ts      # No database required

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed initial data
npm run loyalty:seed
```

### API Testing Examples

#### 1. Check User Loyalty Status
```bash
GET /api/loyalty
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "account": {
      "coins": 5000,
      "lifetimeCoins": 12000,
      "tier": "gold",
      "tierMultiplier": 10
    },
    "tiers": {
      "current": { /* tier details */ },
      "next": { /* next tier */ },
      "progress": 65.5
    }
  }
}
```

#### 2. Get Coin History
```bash
GET /api/loyalty/coins?limit=20&offset=0
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "balance": 5000,
    "lifetimeCoins": 12000,
    "coinsValueEGP": "50.00",
    "history": [
      {
        "id": "...",
        "deltaCoins": 1500,
        "reason": "Order completed",
        "source": "order",
        "createdAt": "2024-12-01T10:00:00Z"
      }
    ]
  }
}
```

#### 3. Award Coins for Order (Automatic)
```typescript
// In your order completion handler
import { awardOrderCoins } from '@/server/services/eliteLoyalty';

// When order status changes to COMPLETED
await awardOrderCoins(orderId, userId);
// Automatically calculates coins based on order total and user's tier
```

#### 4. Get Active Challenges
```bash
GET /api/loyalty/challenges
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "normal": [ /* normal challenges */ ],
    "elite": [ /* elite challenges */ ],
    "totalActive": 8,
    "completedCount": 2
  }
}
```

#### 5. Admin: Award Bonus Coins
```bash
POST /api/admin/loyalty/coins
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userId": "user123",
  "coins": 1000,
  "reason": "Referral bonus"
}

Response:
{
  "success": true,
  "message": "Coins awarded successfully",
  "data": {
    "userId": "user123",
    "coinsAwarded": 1000,
    "reason": "Referral bonus"
  }
}
```

---

## 📊 Key Business Logic

### Coin Earning Formula
```typescript
// Base coins: 10 coins per 1 EGP spent
baseCoins = orderTotal * 10

// With tier multiplier
totalCoins = baseCoins * (1 + tierMultiplier / 100)

// Example: 100 EGP order at Gold tier (10%)
// baseCoins = 100 * 10 = 1,000
// totalCoins = 1,000 * (1 + 10/100) = 1,100 coins
```

### Redemption Formula
```typescript
// 100 coins = 1 EGP value
egpValue = coins / 100

// Example: 40,000 coins
// egpValue = 40,000 / 100 = 400 EGP
```

### Tier Requirements
Each tier requires monthly:
- Minimum coins earned
- Minimum purchases
- Minimum challenges completed
- Minimum streak days

---

## 🔄 Cron Jobs Setup

### Monthly Tier Check (1st of every month)
```bash
# Vercel Cron or similar
0 0 1 * * npm run loyalty:tier-check
```

### Weekly Challenge Reset (Every Monday)
```bash
0 0 * * 1 npm run loyalty:weekly-reset
```

---

## 💡 Integration Points

### 1. On New User Signup
```typescript
// Automatically create loyalty account
await prisma.loyaltyAccount.create({
  data: {
    userId: user.id,
    coins: 0,
    lifetimeCoins: 0,
    totalSpent: 0,
    tier: 'starter',
    tierMultiplier: 0,
  },
});
```

### 2. On Order Completion
```typescript
// Award coins automatically
import { awardOrderCoins } from '@/server/services/eliteLoyalty';

await prisma.order.update({
  where: { id: orderId },
  data: { status: 'COMPLETED' },
});

await awardOrderCoins(orderId, userId);
```

### 3. On Challenge Completion
```typescript
import { trackOrderChallenges } from '@/server/services/challengeService';

// After order completion
await trackOrderChallenges(userId, orderId, orderTotal, orderItems);
```

### 4. On Social Action
```typescript
import { awardSocialCoins } from '@/server/services/eliteLoyalty';

// When user reviews a product
await awardSocialCoins(
  userId,
  'review',
  productId,
  { rating: 5 }
);
```

---

## 🎯 Common Tasks

### Check User's Current Tier
```typescript
const loyalty = await prisma.loyaltyAccount.findUnique({
  where: { userId },
});

console.log(`Tier: ${loyalty.tier}`);
console.log(`Multiplier: ${loyalty.tierMultiplier}%`);
console.log(`Coins: ${loyalty.coins}`);
```

### Get This Month's Progress
```typescript
const now = new Date();
const progress = await prisma.monthlyTierProgress.findFirst({
  where: {
    userId,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  },
});
```

### Check if User Can Afford Reward
```typescript
const loyalty = await prisma.loyaltyAccount.findUnique({
  where: { userId },
});

const canAfford = loyalty.coins >= rewardItem.coinsCost;
```

---

## 🐛 Troubleshooting

### Coins Not Awarded
1. Check order status is 'COMPLETED'
2. Verify loyalty account exists
3. Check ledger for transaction
4. Review server logs

### Tier Not Updating
1. Run manual tier check: `POST /api/loyalty/tiers/check`
2. Verify monthly progress data
3. Check requirements met
4. Review cron job logs

### Challenge Not Tracking
1. Verify challenge is active
2. Check requirement type matches action
3. Review challenge completion table
4. Check for duplicate completions

---

## 📚 Documentation Links

- **Full System Documentation:** `/docs/ELITE_REWARDS_SYSTEM.md`
- **Migration Guide:** `/docs/ELITE_REWARDS_MIGRATION.md`
- **Usage Guide:** `/docs/ELITE_REWARDS_README.md`
- **Test Report:** `/TEST_REPORT.md`

---

## 🎉 Quick Wins

### Immediate Value for Users
1. **Every order earns coins** - 10 per EGP
2. **Clear tier progression** - See next tier requirements
3. **Tangible rewards** - Redeem for real products
4. **Gamification** - Challenges and streaks

### For Business
1. **Increased order frequency** (monthly requirements)
2. **Higher order values** (to earn more coins)
3. **Customer retention** (tier progression)
4. **User engagement** (challenges and streaks)

---

## 🔒 Security Notes

- All coin transactions are logged
- Admin actions require proper role
- Redemptions are tracked and auditable
- Stock limits prevent overselling
- Rate limiting on bonus awards

---

**Need Help?** Check the full documentation or test scripts for examples.
