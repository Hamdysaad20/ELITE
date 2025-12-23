# Strategic Technical Brief: ELITE Café Deals & Gamification Engine

**Version:** 2.0 (Odoo 19 Native Optimized)  
**Last Updated:** December 2024  
**Status:** Technical Implementation Guide

---

## Executive Summary

This document provides the technical implementation details for the ELITE Café Deals & Gamification Engine, optimized for **Odoo 19** integration. It combines strategic vision with production-ready technical requirements, including anti-gaming guardrails, inventory awareness, and scalable architecture.

**Objective:** Deploy a scalable, inventory-aware deals system integrated with Odoo POS to drive AOV, engagement, and retention while protecting margins and brand equity.

---

## 1. Core Business Guardrails

### A. The 40% Safety Cap

**Rule:** No combination of deals, loyalty rewards, or manual discounts shall exceed 40% of the original item value.

**Implementation:**
```typescript
function validateTotalDiscount(
  dealDiscount: number,
  badgeDiscount: number,
  loyaltyDiscount: number
): number {
  const totalDiscount = dealDiscount + badgeDiscount + loyaltyDiscount;
  const cappedDiscount = Math.min(totalDiscount, 40); // Hard cap at 40%
  
  if (totalDiscount > 40) {
    console.warn(`Discount capped from ${totalDiscount}% to 40%`);
  }
  
  return cappedDiscount;
}
```

**Validation Points:**
- Server-side validation in `/api/deals` route
- Cart calculation endpoint
- Order processing endpoint
- Display message: *"Max savings of 40% applied!"*

### B. Psychological Pricing & Premium Rounding

**Rule:** All calculated prices must use Premium Rounding (ending in .00 or .50) to maintain brand aesthetics.

**Implementation:**
```typescript
function premiumRound(price: number): number {
  return Math.round(price / 5) * 5;
}

// Examples:
// 113 EGP → 115 EGP
// 127 EGP → 125 EGP
// 98 EGP → 100 EGP
// 87.3 EGP → 85 EGP
```

**Application:**
- Combo prices
- Deal prices after discount calculation
- Final cart totals (if needed)
- Display prices on frontend

**Formula:**
$$\text{Final Price} = 5 \times \text{round}\left(\frac{\text{Calculated Price}}{5}\right)$$

### C. Anti-Gaming: Cooling Periods

**Rule:** Re-activation deals (e.g., "We Miss You") can only be triggered once every 60 days per user.

**Implementation:**
```typescript
interface UserReactivationDeal {
  userId: string;
  dealType: 'we-miss-you' | 'come-back' | 'favorite-returns';
  lastTriggeredAt: Date;
  cooldownDays: number; // 60 for re-activation deals
}

function canTriggerReactivationDeal(
  userId: string,
  dealType: string
): boolean {
  const userDeal = await getUserReactivationDeal(userId, dealType);
  
  if (!userDeal) return true; // First time
  
  const daysSinceLastTrigger = 
    (Date.now() - userDeal.lastTriggeredAt.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysSinceLastTrigger >= userDeal.cooldownDays;
}
```

**Database Schema:**
```sql
CREATE TABLE user_reactivation_deals (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  deal_type VARCHAR(50) NOT NULL,
  last_triggered_at TIMESTAMP NOT NULL,
  cooldown_days INTEGER DEFAULT 60,
  UNIQUE(user_id, deal_type)
);
```

---

## 2. Odoo 19 Native Integration

### A. Combo Architecture

**Model Structure:**
- Use `product.template` with `type: 'combo'`
- Map Odoo 19 `product.combo` choice sets to frontend UI
- Each choice set represents a component category

**Odoo Configuration:**
```python
# Example: Turkish Delight Combo
combo_product = {
    'name': 'Turkish Delight',
    'type': 'combo',
    'list_price': 75.00,  # Premium rounded
    'combo_choice_sets': [
        {
            'name': 'Pick Your Coffee',
            'required': True,
            'options': [
                {'product_id': turkish_coffee_id, 'extra_price': 0},
                {'product_id': espresso_id, 'extra_price': 5},
            ]
        },
        {
            'name': 'Pick Your Pastry',
            'required': True,
            'options': [
                {'product_id': croissant_id, 'extra_price': 0},
                {'product_id': cookie_id, 'extra_price': -5},
            ]
        }
    ]
}
```

**Frontend Mapping:**
```typescript
interface ComboChoiceSet {
  name: string;
  required: boolean;
  options: Array<{
    productId: string;
    productName: string;
    extraPrice: number;
    available: boolean; // From inventory check
  }>;
}
```

### B. Real-Time Inventory Bridge

**Rule:** Combo is only `available` if at least one item in every mandatory choice set is in stock.

**Implementation:**
```typescript
async function isComboAvailable(comboId: string): Promise<boolean> {
  const combo = await getComboFromOdoo(comboId);
  const choiceSets = combo.choice_sets;
  
  for (const choiceSet of choiceSets) {
    if (!choiceSet.required) continue; // Optional sets don't block availability
    
    const hasAvailableItem = choiceSet.options.some(
      async (option) => {
        const product = await getProductFromOdoo(option.product_id);
        return product.qty_available > 0;
      }
    );
    
    if (!hasAvailableItem) {
      console.log(`Combo ${comboId} unavailable: No stock in "${choiceSet.name}"`);
      return false;
    }
  }
  
  return true;
}
```

**API Integration:**
```typescript
// In /api/deals route
const deals = await processPricelists(pricelists);

// For each combo deal
for (const deal of deals) {
  if (deal.combos) {
    for (const combo of deal.combos) {
      combo.isAvailable = await isComboAvailable(combo.id);
      
      // Also check individual items
      combo.items = combo.items.map(item => ({
        ...item,
        available: item.qty_available > 0
      }));
    }
  }
}
```

**Performance Optimization:**
- Cache inventory status (Redis) with 30-second TTL
- Update cache via Odoo webhooks on stock changes
- Batch inventory checks for multiple combos

### C. Single Source of Truth (SSOT)

**Rule:** All base prices must be fetched from Odoo daily. No static prices in local database.

**Implementation:**
```typescript
// Daily sync job
async function syncPricesFromOdoo() {
  const products = await odooClient.searchRead(
    'product.product',
    [['sale_ok', '=', true]],
    ['id', 'name', 'list_price', 'categ_id']
  );
  
  // Update Redis cache
  for (const product of products) {
    await redis.setex(
      `product:${product.id}:price`,
      86400, // 24 hours
      product.list_price
    );
  }
  
  // Update sync timestamp
  await redis.set('sync:last_price_update', new Date().toISOString());
}
```

**Validation:**
- Compare cached prices with Odoo prices on each API call
- Log warnings if price mismatch detected
- Fallback to Odoo if cache is stale (>24 hours)

---

## 3. High-Performance API Schema

### Endpoint: `GET /api/v1/deals/discovery`

**Purpose:** Serves the deals page with high performance. Must be cached (Redis) and updated via Odoo webhooks.

**Query Parameters:**
- `includeInactive` (boolean): Include deals outside time windows
- `userId` (string, optional): For personalized recommendations
- `category` (string, optional): Filter by category

**Response Schema:**
```json
{
  "metadata": {
    "total": 50,
    "server_time": "2025-12-23T14:00:00Z",
    "timezone": "Africa/Cairo",
    "cache_hit": true,
    "cache_age_seconds": 45
  },
  "results": [
    {
      "deal_id": "odoo_id_101",
      "slug": "turkish-delight-combo",
      "display_name": "Turkish Delight",
      "pricing": {
        "deal_price": 75.00,
        "original_value": 90.00,
        "savings_percent": 17,
        "savings_amount": 15.00
      },
      "selection_logic": {
        "choice_sets": [
          {
            "name": "Pick Your Coffee",
            "required": true,
            "options": [
              {
                "id": "product_123",
                "name": "Turkish Coffee",
                "extra": 0,
                "available": true,
                "qty_available": 50
              }
            ]
          },
          {
            "name": "Pick Your Pastry",
            "required": true,
            "options": [
              {
                "id": "product_456",
                "name": "Croissant",
                "extra": 0,
                "available": true,
                "qty_available": 30
              }
            ]
          }
        ]
      },
      "gamification": {
        "badge_id": "early_bird",
        "streak_eligible": true,
        "bingo_square": "breakfast-combo"
      },
      "is_available": true,
      "ends_in_seconds": 3600,
      "inventory_status": {
        "all_items_in_stock": true,
        "low_stock_warning": false,
        "min_stock_level": 10
      },
      "time_window": {
        "description": "Weekends",
        "active": true,
        "next_activation": "2025-12-27T00:00:00Z"
      }
    }
  ]
}
```

**Caching Strategy:**
```typescript
async function getDealsDiscovery(userId?: string): Promise<DealsResponse> {
  const cacheKey = `deals:discovery:${userId || 'anonymous'}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    const data = JSON.parse(cached);
    // Check if cache is still fresh (< 5 minutes)
    if (Date.now() - data.cached_at < 5 * 60 * 1000) {
      return {
        ...data,
        metadata: { ...data.metadata, cache_hit: true }
      };
    }
  }
  
  // Generate fresh data
  const deals = await generateDealsData(userId);
  const response = {
    ...deals,
    metadata: {
      ...deals.metadata,
      cache_hit: false,
      cached_at: Date.now()
    }
  };
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(response));
  
  return response;
}
```

**Performance Targets:**
- Response time: < 200ms (cached), < 500ms (uncached)
- Cache hit rate: > 80%
- Payload size: < 100KB (compressed)

---

## 4. Gamification Data Architecture

### A. Achievement Tracking Table

**Schema:**
```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  achievement_id VARCHAR(100) NOT NULL,
  progress INTEGER DEFAULT 0,
  target INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP,
  last_triggered_at TIMESTAMP, -- For cooling periods
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement ON user_achievements(achievement_id);
```

**TypeScript Interface:**
```typescript
interface UserAchievement {
  userId: string;
  achievementId: string; // e.g., 'morning-legend', 'combo-master'
  progress: number; // Current count (e.g., 3 out of 5)
  target: number; // Required count
  isCompleted: boolean;
  unlockedAt?: Date;
  lastTriggeredAt?: Date; // For cooling periods
}
```

**Achievement Definitions:**
```typescript
const ACHIEVEMENTS = {
  'morning-legend': {
    name: 'Morning Legend',
    description: 'Purchase 5 Monday Morning deals',
    target: 5,
    reward: {
      type: 'badge',
      badge: 'morning-legend',
      discount: 5, // Permanent 5% off Coffee
    }
  },
  'combo-master': {
    name: 'Combo Master',
    description: 'Purchase 10 unique combos',
    target: 10,
    reward: {
      type: 'physical',
      item: 'Custom Elite Mug',
      discount: 10, // 10% permanent combo discount
    }
  },
  'the-strategist': {
    name: 'The Strategist',
    description: 'Use a Flash Sale + Maintain Streak',
    target: 1,
    reward: {
      type: 'loyalty',
      multiplier: 2, // Double loyalty points for 1 week
      duration_days: 7,
    }
  },
  // ... more achievements
};
```

### B. The "Streak" Engine

**Schema:**
```sql
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  streak_type VARCHAR(50) NOT NULL, -- 'deal' | 'combo' | 'time-traveler'
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_purchase_date TIMESTAMP,
  grace_period_ends TIMESTAMP, -- 4-hour grace for time-based challenges
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, streak_type)
);
```

**Logic:**
```typescript
async function updateStreak(
  userId: string,
  streakType: 'deal' | 'combo' | 'time-traveler',
  purchaseDate: Date
): Promise<number> {
  const streak = await getUserStreak(userId, streakType);
  
  if (!streak) {
    // First purchase - start streak
    await createStreak(userId, streakType, purchaseDate);
    return 1;
  }
  
  const hoursSinceLastPurchase = 
    (purchaseDate.getTime() - streak.lastPurchaseDate.getTime()) / (1000 * 60 * 60);
  
  // Check grace period for time-traveler challenge
  if (streakType === 'time-traveler' && streak.gracePeriodEnds) {
    if (purchaseDate <= streak.gracePeriodEnds) {
      // Within grace period - continue streak
      streak.currentStreak += 1;
      streak.lastPurchaseDate = purchaseDate;
      await updateStreakRecord(streak);
      return streak.currentStreak;
    }
  }
  
  // Regular streak logic: 24-48 hour window
  if (hoursSinceLastPurchase >= 24 && hoursSinceLastPurchase <= 48) {
    // Continue streak
    streak.currentStreak += 1;
    streak.lastPurchaseDate = purchaseDate;
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }
    await updateStreakRecord(streak);
    return streak.currentStreak;
  } else if (hoursSinceLastPurchase > 48) {
    // Streak broken - reset
    streak.currentStreak = 1;
    streak.lastPurchaseDate = purchaseDate;
    await updateStreakRecord(streak);
    return 1;
  }
  
  // Too soon (< 24 hours) - no change
  return streak.currentStreak;
}
```

**Grace Period for Time Traveler:**
```typescript
function setGracePeriod(
  purchaseDate: Date,
  dealTimeWindow: TimeWindow
): Date {
  // 4-hour grace period for time-based challenges
  const gracePeriodEnds = new Date(purchaseDate);
  gracePeriodEnds.setHours(gracePeriodEnds.getHours() + 4);
  return gracePeriodEnds;
}
```

---

## 5. Enhanced API Endpoints

### A. Deal Discovery Endpoint

**Endpoint:** `GET /api/v1/deals/discovery`

**Features:**
- High-performance caching (Redis)
- Inventory-aware filtering
- User eligibility checking
- Time window validation
- Personalized recommendations

**Implementation:**
```typescript
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const includeInactive = url.searchParams.get('includeInactive') === 'true';
  
  // Check cache first
  const cacheKey = `deals:discovery:${userId || 'anonymous'}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    const data = JSON.parse(cached);
    if (Date.now() - data.cached_at < 5 * 60 * 1000) {
      return jsonResponse(data);
    }
  }
  
  // Generate fresh data
  const deals = await processDeals({
    userId,
    includeInactive,
    checkInventory: true,
    checkUserEligibility: true,
  });
  
  // Apply premium rounding
  deals.results = deals.results.map(deal => ({
    ...deal,
    pricing: {
      ...deal.pricing,
      deal_price: premiumRound(deal.pricing.deal_price),
    }
  }));
  
  // Cache response
  await redis.setex(cacheKey, 300, JSON.stringify(deals));
  
  return jsonResponse(deals);
}
```

### B. Active Deals Endpoint

**Endpoint:** `GET /api/v1/deals/active`

**Purpose:** Returns only deals that are:
- Currently active (time window valid)
- Inventory available (all components in stock)
- User eligible (no cooling period restrictions)

**Implementation:**
```typescript
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  
  const allDeals = await getDealsDiscovery(userId);
  
  // Filter to active deals only
  const activeDeals = allDeals.results.filter(deal => {
    // Time validation
    if (!deal.time_window.active) return false;
    
    // Inventory check
    if (!deal.is_available) return false;
    if (deal.inventory_status && !deal.inventory_status.all_items_in_stock) {
      return false;
    }
    
    // User eligibility (cooling periods)
    if (userId && deal.gamification?.requires_cooldown) {
      const canTrigger = await canTriggerReactivationDeal(userId, deal.deal_id);
      if (!canTrigger) return false;
    }
    
    return true;
  });
  
  return jsonResponse({
    ...allDeals,
    results: activeDeals,
    metadata: {
      ...allDeals.metadata,
      active_count: activeDeals.length,
    }
  });
}
```

---

## 6. Success Metrics Tracking

### A. Analytics Data Model

**Schema:**
```sql
CREATE TABLE deal_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(50) NOT NULL, -- 'viewed' | 'added_to_cart' | 'purchased'
  event_data JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_deal_analytics_deal ON deal_analytics(deal_id);
CREATE INDEX idx_deal_analytics_user ON deal_analytics(user_id);
CREATE INDEX idx_deal_analytics_timestamp ON deal_analytics(timestamp);
```

### B. Key Metrics Calculations

**1. AOV Lift:**
```typescript
async function calculateAOVLift(dealId: string): Promise<number> {
  // Get deal orders
  const dealOrders = await getOrdersWithDeal(dealId);
  const dealAOV = dealOrders.reduce((sum, order) => sum + order.total, 0) / dealOrders.length;
  
  // Get user's historical non-deal AOV
  const userIds = [...new Set(dealOrders.map(o => o.userId))];
  const nonDealAOV = await getAverageNonDealAOV(userIds);
  
  // Calculate lift
  const lift = ((dealAOV - nonDealAOV) / nonDealAOV) * 100;
  return lift;
}
```

**2. Redemption Velocity:**
```typescript
async function calculateRedemptionVelocity(dealId: string): Promise<number> {
  const events = await getDealEvents(dealId);
  
  const velocities = events
    .filter(e => e.event_type === 'purchased')
    .map(event => {
      const viewedEvent = events.find(
        e => e.user_id === event.user_id && 
        e.event_type === 'viewed' && 
        e.timestamp < event.timestamp
      );
      
      if (!viewedEvent) return null;
      
      return (event.timestamp - viewedEvent.timestamp) / 1000; // seconds
    })
    .filter(v => v !== null);
  
  return velocities.reduce((sum, v) => sum + v, 0) / velocities.length; // Average in seconds
}
```

**3. Cannibalization Rate:**
```typescript
async function calculateCannibalizationRate(dealId: string): Promise<number> {
  const dealOrders = await getOrdersWithDeal(dealId);
  const userIds = [...new Set(dealOrders.map(o => o.userId))];
  
  // Check if users bought these items at full price before
  let cannibalizedCount = 0;
  for (const userId of userIds) {
    const previousOrders = await getPreviousOrders(userId);
    const dealProducts = dealOrders
      .filter(o => o.userId === userId)
      .flatMap(o => o.items.map(i => i.productId));
    
    const hadBoughtBefore = dealProducts.some(productId =>
      previousOrders.some(order =>
        order.items.some(item => 
          item.productId === productId && 
          item.unitPrice === item.originalPrice // Full price
        )
      )
    );
    
    if (hadBoughtBefore) cannibalizedCount++;
  }
  
  return (cannibalizedCount / userIds.length) * 100; // Percentage
}
```

---

## 7. Future Dashboard & Automation

### A. Goal-Based Optimization

**Goal Types:**
1. **Revenue Target:** System adjusts discount levels, deal timing, product selection
2. **Order Volume Target:** Focuses on high-conversion deals
3. **Profit Target:** Balances discount with margin
4. **Customer Acquisition Target:** Emphasizes first-time user deals
5. **Retention Target:** Optimizes for repeat purchases

**Automated Actions:**
```typescript
async function optimizeForGoal(goal: Goal): Promise<void> {
  const currentPerformance = await getCurrentPerformance();
  const gap = goal.target - currentPerformance.current;
  
  if (gap > 0) {
    // Underperforming - increase aggressiveness
    if (goal.type === 'revenue') {
      // Increase discount on high-margin items
      await increaseDiscountsOnHighMarginItems(5); // +5%
      
      // Extend time windows for popular deals
      await extendTimeWindows('Happy Hour', 1); // +1 hour
      
      // Add more flash sales
      await increaseFlashSaleFrequency(2); // 2x per day
    }
  } else {
    // Overperforming - optimize margin
    await decreaseDiscountsOnHighPerformingDeals(2); // -2%
  }
}
```

### B. Stock-Based Automatic Promotions

**Logic:**
```typescript
async function checkStockLevelsAndPromote(): Promise<void> {
  const products = await getProductsFromOdoo();
  
  for (const product of products) {
    // High stock threshold (e.g., > 100 units)
    if (product.qty_available > 100) {
      // Find combos containing this product
      const combos = await findCombosWithProduct(product.id);
      
      // Flag combos as "Featured Deal"
      for (const combo of combos) {
        await flagComboAsFeatured(combo.id, {
          reason: 'high_stock',
          product: product.name,
          stock_level: product.qty_available,
        });
      }
    }
  }
}
```

**Scheduled Job:**
- Run every 6 hours
- Check all product stock levels
- Automatically flag/promote combos with high stock items
- Update deal visibility on frontend

---

## 8. Implementation Checklist

### Phase 1: Core Guardrails ✅
- [x] 40% hard cap validation
- [x] Premium rounding logic
- [x] Cooling period system
- [x] Server-side validation

### Phase 2: Odoo Integration
- [ ] Inventory bridge implementation
- [ ] Real-time stock checks
- [ ] Combo product structure in Odoo
- [ ] Price sync from Odoo

### Phase 3: API Enhancement
- [ ] High-performance discovery endpoint
- [ ] Caching strategy (Redis)
- [ ] Inventory-aware filtering
- [ ] User eligibility checking

### Phase 4: Gamification
- [ ] Achievement tracking tables
- [ ] Streak engine
- [ ] Badge system
- [ ] Reward distribution

### Phase 5: Analytics
- [ ] Event tracking
- [ ] AOV lift calculation
- [ ] Redemption velocity tracking
- [ ] Cannibalization rate monitoring

### Phase 6: Automation
- [ ] Goal-based optimization
- [ ] Stock-based promotions
- [ ] Automated deal rotation
- [ ] Performance-based adjustments

---

## 9. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **API Response Time** | < 200ms (cached) | P95 latency |
| **Cache Hit Rate** | > 80% | Redis cache hits |
| **Inventory Check Time** | < 50ms | Odoo query time |
| **Deal Availability Accuracy** | > 99% | Stock mismatches |
| **Discount Calculation Accuracy** | 100% | Price validation |

---

## 10. Security Considerations

### A. Server-Side Validation Only
- All discount calculations on server
- No client-side price manipulation
- Time validation on server
- User eligibility checks on server

### B. Rate Limiting
- Deal discovery: 60 requests/minute per user
- Deal activation: 10 requests/minute per user
- Admin endpoints: Authenticated only

### C. Data Protection
- User achievement data: Encrypted at rest
- Purchase history: GDPR compliant
- Analytics: Anonymized where possible

---

## Conclusion

This technical brief provides the foundation for implementing a production-ready, scalable deals system that:

1. **Protects Margins** through hard caps and validation
2. **Maintains Brand** through premium rounding
3. **Prevents Gaming** through cooling periods
4. **Ensures Availability** through inventory checks
5. **Drives Engagement** through gamification
6. **Optimizes Performance** through caching and analytics

The system is designed to evolve from manual configuration to automated optimization, with the ultimate goal of allowing business users to set goals and let the system optimize deals automatically.

---

**Document Owner:** Technical Team  
**Review Cycle:** Monthly  
**Last Review:** December 2024  
**Next Review:** January 2025

