# Deals Scripts Guide

This guide explains how to use the pricelist creation scripts for all deal types.

## Available Scripts

### 1. Monday Morning Deals ✅
**Script:** `scripts/create-monday-deals-pricelist.ts`

**Usage:**
```bash
npx tsx scripts/create-monday-deals-pricelist.ts
```

**What it does:**
- Creates pricelist "Monday Morning Deals"
- Sets fixed prices for specific products:
  - Iced Latte, Hot Latte, Iced Cappuccino, Hot Cappuccino → 40 EGP
  - Espresso, Turkish Coffee → 25 EGP
- Time: Monday 8:00 AM - 1:00 PM (validated server-side)

**Note:** This uses fixed prices. Consider converting to percentages for future flexibility.

---

### 2. Happy Hour Deals
**Script:** `scripts/create-happy-hour-pricelist.ts`

**Usage:**
```bash
# Show eligible products
npx tsx scripts/create-happy-hour-pricelist.ts

# Set specific product
npx tsx scripts/create-happy-hour-pricelist.ts "Product Name"
```

**What it does:**
- Creates pricelist "Happy Hour Deals"
- Sets 20% discount on specified product
- Time: Daily 3:00 PM - 6:00 PM (validated server-side)

**Example:**
```bash
npx tsx scripts/create-happy-hour-pricelist.ts "Iced Latte"
```

**Product Rotation:**
- Products should be rotated daily
- Create a daily cron job or manual update script
- Or use Odoo automation to update the pricelist item daily

---

### 3. Late Night Deals
**Script:** `scripts/create-late-night-pricelist.ts`

**Usage:**
```bash
npx tsx scripts/create-late-night-pricelist.ts
```

**What it does:**
- Creates pricelist "Late Night Deals"
- Sets 15% discount on categories: Coffee, Iced, Tea
- Time: Monday & Thursday, 10:00 PM - 12:00 AM (validated server-side)

**Customization:**
- Edit `TARGET_CATEGORIES` in the script to change categories
- Edit `DISCOUNT_PERCENTAGE` to change discount amount

---

### 4. Flash Sales
**Script:** `scripts/create-flash-sales-pricelist.ts`

**Usage:**
```bash
npx tsx scripts/create-flash-sales-pricelist.ts "Product Name" [discount-percentage]
```

**What it does:**
- Creates pricelist "Flash Sales"
- Sets percentage discount (30-50%) on specified product
- Time: Daily 2:00 PM - 3:00 PM (1-hour window, validated server-side)

**Example:**
```bash
# 40% discount (default)
npx tsx scripts/create-flash-sales-pricelist.ts "Iced Latte"

# 50% discount
npx tsx scripts/create-flash-sales-pricelist.ts "Iced Latte" 50
```

**Product Rotation:**
- Products should be rotated daily
- Create a daily cron job or manual update script

---

## Testing

### Test Deals API
**Script:** `scripts/test-deals-api.ts`

**Usage:**
```bash
npx tsx scripts/test-deals-api.ts
```

**What it does:**
- Tests the `/api/deals` endpoint
- Shows all active deals
- Displays product prices and savings
- Verifies server-side time validation

---

## Validation Script

### Validate Deals Setup
**Script:** `scripts/validate-deals-setup.ts`

**Usage:**
```bash
npx tsx scripts/validate-deals-setup.ts
```

**What it does:**
- Checks Odoo connection
- Lists all active pricelists
- Shows pricelist items and rules
- Validates configuration

---

## Automation

### Daily Product Rotation

For Happy Hour and Flash Sales, you need to rotate products daily. Here are options:

#### Option 1: Manual Update
Run the script daily with a different product:
```bash
npx tsx scripts/create-happy-hour-pricelist.ts "New Product Name"
```

#### Option 2: Scheduled Script
Create a cron job or scheduled task to:
1. Get list of eligible products
2. Select random product
3. Update pricelist item

#### Option 3: Odoo Automation
Use Odoo's automation rules to update pricelist items daily.

---

## Pricelist Configuration in Odoo

After running scripts, pricelists are created in Odoo with:
- ✅ Active status
- ✅ Selectable (available for POS and website)
- ✅ Percentage or fixed price rules
- ✅ Product or category-based rules

### Using Pricelists

**In POS:**
- Assign pricelist to POS config
- Prices automatically apply during checkout

**In Website:**
- Pricelists are automatically detected
- Prices shown on `/deals` page
- Time validation happens server-side

---

## Troubleshooting

### No Deals Showing
1. Check pricelist is active in Odoo
2. Verify pricelist has items
3. Check time validation (deal might not be active)
4. Run validation script: `npx tsx scripts/validate-deals-setup.ts`

### Products Not Found
1. Verify product names match exactly in Odoo
2. Check products are active and saleable
3. Use validation script to see available products

### Prices Not Correct
1. Verify pricelist items are configured correctly
2. Check original product prices in Odoo
3. Test API: `npx tsx scripts/test-deals-api.ts`

---

## Next Steps

1. **Run scripts** to create pricelists
2. **Test API** to verify deals appear
3. **Set up automation** for rotating products (Happy Hour, Flash Sales)
4. **Monitor** deals page to ensure everything works

---

## Scripts to Create (Future)

- Weekend Specials (combo deals)
- Seasonal Promotions
- Holiday Specials
- New Product Launch (auto-detection)
- Elite Yearly University Event
- Combination Deals

These will be created as needed based on requirements.

