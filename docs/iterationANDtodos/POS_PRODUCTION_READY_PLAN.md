# Elite Coffee - POS & Menu Production Ready Plan

## Status: ✅ IMPLEMENTED

**Execution Date:** 2025-01-XX  
**Total Products:** 94 active (archived 34 duplicates + 13 extras)
**Attribute Values:** 1682 configured with pricing

---

## Execution Summary

### Phase 1: Critical Data Cleanup ✅ COMPLETE

#### 1.1 Archive Duplicate Products ✅
- **Archived 34 duplicate products** including:
  - Americano, Cappuccino, Latte, Coffee Frappé, Mocha Frappé
  - Cortado, Espresso, Espresso Macchiato, Flat White
  - Iced Americano, Iced Cappuccino, Iced Chai Latte, Iced Latte, Iced Mocha
  - Matcha Latte (Hot/Iced variants), Mango/Mixed Berry/Passion Fruit/Strawberry Smoothies
  - Turkish Coffee Single, Spanish Latte variants, and more

**Script:** `scripts/phase1_cleanup_duplicates.ts`

#### 1.2 Categorize Uncategorized Products ✅
- **Archived 13 "Extra" products** (should be attributes, not products):
  - Extra whip cream, Extra Shot, Coconut Milk, EXTRA BOBA
  - EXTRA Flavor, Extra Honey, Extra Ice Cream Scoop
  - Premium topping, Discount, Discount 30%, extra Marshmello, etc.

- **Categorized 42 products** to proper categories:
  - Frappes → Frappe
  - Boba drinks → Iced
  - Sodas → Refreshers
  - Food items → Food
  - Tea → Tea

**Script:** `scripts/phase1_categorize_products.ts`

---

### Phase 2: Create Missing Attributes ✅ COMPLETE

Created 4 new attributes:

| Attribute | ID | Values |
|-----------|-----|--------|
| Temperature | 32 | Hot, Iced |
| Whipped Cream | 33 | No Whip, Light Whip, Regular Whip, Extra Whip |
| Drizzle | 34 | No Drizzle, Caramel Drizzle, Chocolate Drizzle, Both Drizzles |
| Foam | 35 | No Foam, Light Foam, Regular Foam, Extra Foam |

**Script:** `scripts/phase2_create_attributes.ts`

---

### Phase 3: Clean Up Attribute Values ✅ COMPLETE

- Renamed "suger" → "Sugar Level"
- Renamed "coffee" → "Espresso Shots"
- Fixed typos: "Mmedium" → "50%", "hint of sugar" → "25%"
- Fixed spacing in shot values

**Script:** `scripts/phase3_cleanup_values.ts`

---

### Phase 4: Apply Attributes to Products ✅ COMPLETE

Applied attributes to 70 products based on category rules:

| Category | Attributes Applied |
|----------|-------------------|
| Coffee | size, milk, espresso shots, flavor, sugar level, foam |
| Tea | size, sugar level |
| Iced | size, milk, espresso shots, flavor, sugar level, ice level, temperature |
| Frappe | size, milk, espresso shots, flavor, whipped cream, drizzle |
| Milkshake | size, milk, flavor, whipped cream |
| Smoothie | size, extras |

**Script:** `scripts/phase4_apply_attributes.ts`

---

### Phase 5: Set Pricing Rules ✅ COMPLETE

Configured pricing for all attribute values:

| Attribute | Value | Extra Price (EGP) |
|-----------|-------|-------------------|
| Size | S | +0 |
| Size | M | +10 |
| Size | L | +20 |
| Milk | Whole Milk | +0 |
| Milk | Oat Milk | +25 |
| Milk | Almond Milk | +25 |
| Milk | Coconut Milk | +25 |
| Espresso Shots | No Shot | +0 |
| Espresso Shots | Single Shot | +20 |
| Espresso Shots | Double Shot | +35 |
| Espresso Shots | Triple Shot | +45 |
| Flavor | Vanilla/Caramel/Hazelnut/etc. | +15 |
| Ice Level | Regular Ice | +0 |
| Ice Level | No Ice | +10 |
| Temperature | Hot | +0 |
| Temperature | Iced | +5 |
| Whipped Cream | No/Light/Regular | +0 |
| Whipped Cream | Extra Whip | +10 |
| Drizzle | No Drizzle | +0 |
| Drizzle | Caramel/Chocolate | +10 |
| Drizzle | Both | +15 |
| Extras | Tapioca Pearls/Boba | +30 |

**Script:** `scripts/apply_pricing.ts`

---

### Phase 6: Frontend Sync Test ✅ COMPLETE

Verified data is ready for frontend:
- 322 product variants available
- 1682 attribute values with pricing configured
- All categories properly structured

**Script:** `scripts/phase6_test_sync.ts`

---

## Current Attribute List (35 Total)

| ID | Name | Values |
|----|------|--------|
| 7 | Size | S, M, L |
| 11 | Sugar Level | No Sugar, Less Sugar, Half Sugar, Regular Sugar, Extra Sugar |
| 12 | Espresso Shots | No Shot, Single Shot, Double Shot, Triple Shot |
| 14 | Flavor | Vanilla, Caramel, Hazelnut, Pistachio, Cinnamon, Strawberry, Honey, Mint |
| 27 | Milk | Whole Milk, Oat Milk, Almond Milk, Coconut Milk |
| 31 | Ice Level | Regular Ice, No Ice |
| 32 | Temperature | Hot, Iced |
| 33 | Whipped Cream | No Whip, Light Whip, Regular Whip, Extra Whip |
| 34 | Drizzle | No Drizzle, Caramel Drizzle, Chocolate Drizzle, Both Drizzles |
| 35 | Foam | No Foam, Light Foam, Regular Foam, Extra Foam |
| 10 | Extras | Tapioca Pearls, Boba Extra |

---

## Scripts Created

| Script | Purpose |
|--------|---------|
| `phase1_cleanup_duplicates.ts` | Archive duplicate products |
| `phase1_categorize_products.ts` | Categorize uncategorized products |
| `phase1_manual_fixes.ts` | Manual category fixes |
| `phase2_create_attributes.ts` | Create missing attributes |
| `phase3_cleanup_values.ts` | Fix attribute value typos |
| `phase4_apply_attributes.ts` | Apply attributes to products by category |
| `phase6_test_sync.ts` | Test frontend sync data |
| `apply_pricing.ts` | Master pricing configuration |
| `check_categories.ts` | Check category distribution |

---

## Next Steps (Optional Enhancements)

1. **Merge Hot/Iced Variants** - Instead of separate "Chai Latte (Hot)" and "Iced Chai Latte", have one "Chai Latte" with Temperature attribute
2. **Create Boba & Bubble Tea category** - Split boba drinks from Iced Drinks
3. **Add more boba toppings** - Coconut Jelly, Grass Jelly, Pudding, Popping Boba, Cheese Foam
4. **Review pricing consistency** - Ensure all prices align with business requirements
5. **Add product images** - Ensure all products have images configured

---

## How to Re-Run Scripts

```bash
# Run any script
cd /Users/hamdysaad/ELITE
npx tsx -r dotenv/config scripts/<script-name>.ts

# Example: Re-apply pricing
npx tsx -r dotenv/config scripts/apply_pricing.ts

# Example: Check categories
npx tsx -r dotenv/config scripts/check_categories.ts
```

---

**Implementation Complete!** ✅

### 3.2 Move Uncategorized Products
- [ ] Caramel Frappé → Frappe
- [ ] Vanilla Frappé → Frappe
- [ ] Pistachio Frappé → Frappe
- [ ] Golden Peach Sunrise → Sodas & Refreshers
- [ ] Black Cat → (determine category)
- [ ] ice Flavours → (determine category)

### 3.3 Archive "Extra" Products (Use Attributes Instead)
- [ ] Archive: Extra whip cream (use Whipped Cream attr)
- [ ] Archive: Extra Shot (use Espresso Shots attr)
- [ ] Archive: EXTRA Flavor (use Flavor attr)
- [ ] Archive: Coconut Milk product (use Milk attr)
- [ ] Archive: [EXTRA]Coconut Milk (use Milk attr)
- [ ] Archive: Extra Honey (use Flavor attr or new Sweetener attr)
- [ ] Archive: extra Marshmello (use Toppings attr)
- [ ] Archive: Premium topping (use specific topping attrs)

---

## Phase 4: Apply Attributes to Products (P1)

### 4.1 Coffee Products - Apply These Attributes:
- Size (S/M/L)
- Temperature (Hot/Iced) - NEW
- Milk
- Sugar
- Espresso Shots
- Flavor
- Whipped Cream - NEW (for Frappe/Mocha)
- Drizzle - NEW

### 4.2 Tea Products - Apply These Attributes:
- Size (S/M/L)
- Temperature (Hot/Iced) - NEW
- Milk (for Chai Latte, Matcha Latte)
- Sugar

### 4.3 Boba Products - Apply These Attributes:
- Size (S/M/L)
- Sugar
- Ice Level
- Milk
- Boba Toppings
- Flavor
- Cheese Foam - NEW

### 4.4 Frappe Products - Apply These Attributes:
- Size (S/M/L)
- Milk
- Espresso Shots
- Flavor
- Whipped Cream (Default: Included)
- Drizzle

### 4.5 Milkshake Products - Apply These Attributes:
- Size (S/M/L)
- Milk
- Whipped Cream
- Drizzle

---

## Phase 5: Frappe Whipped Cream Default (P1)

### 5.1 Update Frappe Products
- [ ] Coffee Frappé: Set Whipped Cream default to "Included"
- [ ] Mocha Frappé: Set Whipped Cream default to "Included"
- [ ] Caramel Frappé: Set Whipped Cream default to "Included"
- [ ] Vanilla Frappé: Set Whipped Cream default to "Included"
- [ ] Pistachio Frappé: Set Whipped Cream default to "Included"

---

## Phase 6: Price Verification (P2)

### 6.1 Verify Base Prices (After Merging Duplicates)
- [ ] Ensure all products have correct base price
- [ ] Verify attribute extra prices are consistent
- [ ] Test total price calculation with various combinations

---

## Phase 7: Frontend Sync & Testing (P2)

### 7.1 Sync to Frontend
- [ ] Trigger product sync to Redis
- [ ] Verify categories display correctly on website
- [ ] Verify product attributes show on product detail page
- [ ] Test price calculation with customizations

### 7.2 POS Testing
- [ ] Test order flow in Odoo POS
- [ ] Verify barista can select all attributes
- [ ] Test kitchen ticket generation with customizations

---

## Execution Script Checklist

| Script | Purpose | Status |
|--------|---------|--------|
| `cleanup_duplicates.ts` | Archive duplicate products | ⬜ |
| `create_temperature_attr.ts` | Create Temperature attribute | ⬜ |
| `create_whipped_cream_attr.ts` | Create Whipped Cream attribute | ⬜ |
| `create_drizzle_attr.ts` | Create Drizzle attribute | ⬜ |
| `cleanup_attr_values.ts` | Remove duplicate attribute values | ⬜ |
| `reorganize_categories.ts` | Flatten and rename categories | ⬜ |
| `apply_attrs_to_products.ts` | Apply new attributes to products | ⬜ |
| `archive_extra_products.ts` | Archive "Extra X" products | ⬜ |
| `verify_pricing.ts` | Verify all pricing is correct | ⬜ |

---

## Notes

- **Backup First**: Always export current Odoo data before making changes
- **Test in Staging**: If possible, test scripts in a staging environment
- **Incremental**: Run one phase at a time and verify before proceeding
- **Rollback Plan**: Keep archived products (don't delete) for easy rollback

---

## Progress Tracking

- [ ] Phase 1: Critical Data Cleanup
- [ ] Phase 2: Add Missing Attributes
- [ ] Phase 3: Category Reorganization
- [ ] Phase 4: Apply Attributes to Products
- [ ] Phase 5: Frappe Whipped Cream Default
- [ ] Phase 6: Price Verification
- [ ] Phase 7: Frontend Sync & Testing

---

*Last Updated: December 7, 2025*
