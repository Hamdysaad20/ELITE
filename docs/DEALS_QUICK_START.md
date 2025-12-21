# Deals Quick Start Guide

## ✅ What's Working

- ✅ Server-side time validation
- ✅ Percentage-based discounts
- ✅ Automatic pricelist detection
- ✅ POS and website synchronization
- ✅ Product rotation scripts

## 🚀 Quick Setup

### 1. Test Current Deals

```bash
# Test API
npx tsx scripts/test-deals-api.ts

# Validate setup
npx tsx scripts/validate-deals-setup.ts
```

### 2. Create New Deals

**Happy Hour Deals (20% off, daily 3-6 PM):**
```bash
# First time setup
npx tsx scripts/create-happy-hour-pricelist.ts "Product Name"

# Daily rotation (automated)
npx tsx scripts/rotate-happy-hour-product.ts
```

**Late Night Deals (15% off categories, Mon/Thu 10 PM-12 AM):**
```bash
npx tsx scripts/create-late-night-pricelist.ts
```

**Flash Sales (30-50% off, daily 2-3 PM):**
```bash
# First time setup
npx tsx scripts/create-flash-sales-pricelist.ts "Product Name" 40

# Daily rotation (automated)
npx tsx scripts/rotate-flash-sales-product.ts
```

### 3. Set Up Automation

**Option A: Cron (Recommended)**
```bash
crontab -e
```

Add:
```cron
# Happy Hour - 2 PM daily
0 14 * * * cd /path/to/ELITE && npx tsx scripts/rotate-happy-hour-product.ts

# Flash Sales - 1 PM daily
0 13 * * * cd /path/to/ELITE && npx tsx scripts/rotate-flash-sales-product.ts
```

**Option B: Manual (for testing)**
```bash
# Run daily at specified times
npx tsx scripts/rotate-happy-hour-product.ts
npx tsx scripts/rotate-flash-sales-product.ts
```

## 📋 Current Status

**Active Deals:**
- ✅ 30% discount (global, all products)
- ⏳ Monday Morning Deals (needs setup)
- ⏳ Happy Hour Deals (needs setup)
- ⏳ Late Night Deals (needs setup)
- ⏳ Flash Sales (needs setup)

## 🧪 Testing

1. **Test API:**
   ```bash
   npx tsx scripts/test-deals-api.ts
   ```

2. **Visit `/deals` page:**
   - Should show all active deals
   - Prices should match Odoo
   - Time validation should work

3. **Test rotation:**
   ```bash
   npx tsx scripts/rotate-happy-hour-product.ts
   npx tsx scripts/rotate-flash-sales-product.ts
   ```

## 📚 Documentation

- `docs/DEALS_IMPLEMENTATION_PLAN.md` - Full implementation plan
- `docs/DEALS_REQUIREMENTS.md` - Requirements specification
- `docs/DEALS_SCRIPTS_GUIDE.md` - Scripts usage guide
- `docs/DEALS_AUTOMATION_SETUP.md` - Automation setup guide
- `docs/DEALS_IMPLEMENTATION_STATUS.md` - Current status

## 🎯 Next Steps

1. ✅ Test API (done)
2. ⏳ Create pricelists for new deals
3. ⏳ Set up automation (cron)
4. ⏳ Test on `/deals` page
5. ⏳ Monitor and adjust

---

**Everything is ready!** Just create the pricelists and set up automation.

