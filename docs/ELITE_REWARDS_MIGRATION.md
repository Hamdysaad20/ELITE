# 🔄 ELITE Rewards Migration Guide

Guide for migrating from the old loyalty system (points + 4 tiers) to the new ELITE Rewards System (coins + 10 tiers).

---

## Overview

### Old System
- **Currency:** Points (1 point per 10 EGP spent)
- **Tiers:** Bronze, Silver, Gold, Platinum (4 tiers)
- **Multipliers:** 1x, 1.5x, 2x, 3x
- **Thresholds:** Based on total points (100, 500, 1000)

### New System
- **Currency:** Coins (10 coins per 1 EGP spent, 100 coins = 1 EGP value)
- **Tiers:** 10 progressive tiers (Starter → Founder)
- **Multipliers:** 0% - 25% bonus coins
- **Requirements:** Monthly activity-based (coins, purchases, challenges, streaks)

---

## Database Migration

### Step 1: Run Prisma Migration

```bash
# Generate migration
npx prisma migrate dev --name elite_rewards_system

# Apply migration
npx prisma migrate deploy
```

### Step 2: Migrate Existing Data

Run the data migration script:

```bash
ts-node scripts/migrate-loyalty-data.ts
```

This script will:
1. Convert points to coins (points × 100)
2. Map old tiers to new tiers
3. Initialize monthly progress records
4. Create streak records
5. Preserve ledger history

### Conversion Formula

```typescript
// Points to Coins
newCoins = oldPoints * 100

// Tier Mapping
const tierMap = {
  'bronze': 'starter',
  'silver': 'black',
  'gold': 'silver',
  'platinum': 'gold'
}

// Multiplier Mapping
const multiplierMap = {
  'bronze': 0,    // was 1x
  'silver': 5,    // was 1.5x
  'gold': 7,      // was 2x
  'platinum': 10  // was 3x
}
```

---

## API Changes

### Deprecated Endpoints
- ❌ Old: `GET /api/loyalty` (still works but deprecated)
  - ✅ New: Use same endpoint, now returns expanded data

### Response Format Changes

**Before:**
```json
{
  "account": {
    "points": 250,
    "level": "silver"
  }
}
```

**After:**
```json
{
  "account": {
    "coins": 25000,
    "lifetimeCoins": 30000,
    "tier": "black",
    "tierMultiplier": 5
  },
  "streak": { ... },
  "monthlyProgress": { ... }
}
```

### New Endpoints

All new endpoints are additive:
- `GET /api/loyalty/coins`
- `GET /api/loyalty/tiers`
- `GET /api/loyalty/challenges`
- `GET /api/loyalty/streaks`
- `GET /api/loyalty/avatars`
- `GET /api/loyalty/rewards`
- `POST /api/loyalty/social`

---

## Backwards Compatibility

The old `loyalty.ts` service is preserved with deprecated wrappers:

```typescript
// Old function still works
awardOrderPoints(orderId, userId) 
// Internally calls: awardOrderCoins()

// Old function signature maintained
deductPoints(userId, points, reason)
// Internally calls: redeemCoins()
```

### Gradual Migration Strategy

1. **Phase 1:** Deploy new system, keep old APIs working
2. **Phase 2:** Update frontend to use new endpoints
3. **Phase 3:** Migrate user data
4. **Phase 4:** Remove deprecated functions (6 months later)

---

## User Communication

### Email Template

**Subject:** 🌟 Introducing the New ELITE Rewards System!

**Body:**
```
Dear [Name],

We're excited to announce a major upgrade to our loyalty program!

What's New:
✨ Coins Replace Points (Your 250 points = 25,000 coins!)
🎯 10 New Elite Tiers (More ways to earn exclusive rewards)
🏆 Challenges & Streaks (Bonus coins for achievements)
👤 Avatars & Customization (Show off your status)
🎁 Expanded Rewards Shop (More items to redeem)

Your Account:
- Previous Tier: Silver
- New Tier: Black
- Coin Balance: 25,000 coins (worth 250 EGP in rewards!)

Start exploring your new benefits today!

[Explore Rewards] [View Challenges]
```

### In-App Announcement

Show a modal on first login after migration:
- Explain the upgrade
- Show their migrated balance
- Highlight new features
- Offer a "welcome back" bonus (e.g., 500 coins)

---

## Testing Checklist

### Pre-Migration Testing

- [ ] Test migration script on staging database
- [ ] Verify coin calculations are correct
- [ ] Test tier mapping for all users
- [ ] Validate ledger history preservation
- [ ] Test new API endpoints
- [ ] Verify backwards compatibility

### Post-Migration Testing

- [ ] Verify all users have correct coin balances
- [ ] Check tier assignments
- [ ] Test coin earning on new orders
- [ ] Test challenge tracking
- [ ] Test streak mechanics
- [ ] Test rewards redemption
- [ ] Verify avatar system
- [ ] Check admin controls

### Edge Cases

- [ ] Users with 0 points
- [ ] Users with very high points (> 10,000)
- [ ] Users with negative points (if any)
- [ ] Inactive users
- [ ] Users mid-order during migration

---

## Rollback Plan

If critical issues arise:

### Database Rollback
```bash
# Revert to previous migration
npx prisma migrate resolve --rolled-back elite_rewards_system

# Restore from backup
pg_restore -d elite_db backup_before_migration.sql
```

### Code Rollback
```bash
# Revert git commit
git revert <migration-commit-hash>

# Redeploy previous version
git push origin main
```

### Data Recovery
- Full database backup before migration
- Export critical tables (LoyaltyAccount, LoyaltyLedger)
- Keep backups for 30 days

---

## Monitoring

### Key Metrics to Watch

**First 24 Hours:**
- API error rates
- Coin calculation accuracy
- User login success rate
- Support ticket volume

**First Week:**
- Coin earning rates
- Tier distribution
- Challenge completion rates
- Redemption rates
- User engagement

**First Month:**
- Monthly tier transitions
- Streak retention
- Reward shop activity
- User satisfaction scores

### Alert Thresholds

Set up alerts for:
- API errors > 1%
- Negative coin balances
- Failed tier checks
- Redemption failures

---

## Support Resources

### FAQ for Support Team

**Q: Why did my points become coins?**  
A: We upgraded the system! Your 1 point is now worth 100 coins. Same value, better rewards.

**Q: What happened to my tier?**  
A: Tiers were remapped. Bronze → Starter, Silver → Black, Gold → Silver, Platinum → Gold. Plus 6 new tiers above!

**Q: Are my old rewards still valid?**  
A: Yes! Your coin balance can be used in our expanded rewards shop.

**Q: Why do I need to complete challenges now?**  
A: Challenges are optional bonus ways to earn more coins. Your tier still goes up from purchases!

### Escalation Path

1. Tier 1: Check FAQ and documentation
2. Tier 2: Verify user account in admin panel
3. Tier 3: Check logs and ledger history
4. Tier 4: Developer investigation

---

## Timeline

### Week -2: Preparation
- Finalize migration scripts
- Test on staging
- Prepare communications
- Train support team

### Week -1: Communication
- Send announcement emails
- Update website/app banners
- Prepare in-app modals
- Brief support team

### Day 0: Migration
- 2 AM (low traffic): Run migration
- Monitor for 24 hours
- Support team on standby

### Week 1: Stabilization
- Monitor metrics closely
- Address urgent issues
- Collect user feedback
- Adjust if needed

### Month 1: Optimization
- Analyze engagement data
- Tune challenge rewards
- Adjust tier requirements if needed
- Gather feedback for improvements

---

## Success Criteria

Migration is successful if:
- ✅ 100% of users migrated correctly
- ✅ 0 data loss
- ✅ < 0.5% support tickets related to migration
- ✅ User engagement maintained or improved
- ✅ No critical bugs in first week

---

## Post-Migration Cleanup

### After 30 Days
- Remove old tier references in codebase
- Archive old migration scripts
- Update all documentation

### After 90 Days
- Remove deprecated API wrappers
- Clean up old database columns (if safe)
- Finalize long-term data retention policy

---

## Contact

**Technical Issues:** dev-team@elite.com  
**Migration Questions:** migration-support@elite.com  
**User Support:** support@elite.com

---

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** Ready for Production
