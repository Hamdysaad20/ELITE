# Deals Exclusion Rules

## Overview

Deals should only apply to specific product categories and must exclude certain items that are not suitable for promotional pricing.

## Allowed Categories

Only products from these categories can appear in deals:
- Coffee
- Food
- Frappe
- Iced
- Milkshake
- Smoothie
- Soda
- Tea

## Excluded Categories

These categories should **NEVER** appear in deals:
- **Extras** / **EXTRA** - Add-ons and extras (handled as product attributes)
- **Services** - Administrative items like "OPEN REGISTER"
- **Offers** - Discounts and promotions (not browsable menu items)
- **Expenses** - Internal expense tracking
- **Toppings** - Add-ons (handled as product attributes)
- **Sauces** - Add-ons (handled as product attributes)
- **Elite Essentials** - Internal supplies

## Excluded Product Names

Products with these names (case-insensitive partial match) should **NEVER** appear in deals:
- **deposit** - Deposit items
- **water** - Water products
- **morning bird** - Morning Bird Offer items
- **chai latte** - If this is an offer/promotion

## Implementation

### API Route (`src/app/api/deals/route.ts`)
- Filters products before adding to deals
- Checks both category name and product name
- Excludes products matching excluded categories or names

### Rotation Scripts
- `scripts/rotate-happy-hour-product.ts`
- `scripts/rotate-flash-sales-product.ts`
- Both scripts filter out excluded products before selection

## How It Works

1. **Product Selection**: Only products from allowed categories are considered
2. **Exclusion Check**: Products are filtered to remove:
   - Products in excluded categories
   - Products with excluded names (partial match)
3. **Final Filter**: Only valid products are included in deals

## Examples

### ✅ Allowed
- Coffee products (Coffee category)
- Food items (Food category)
- Iced drinks (Iced category)

### ❌ Excluded
- "Deposit" product → Excluded (matches "deposit")
- "Water" product → Excluded (matches "water")
- "Morning Bird Offer - Chai Latte" → Excluded (matches "morning bird" and "chai latte")
- Products in "Extras" category → Excluded
- Products in "Offers" category → Excluded
- Products in "Services" category → Excluded

## Testing

Test exclusion:
```bash
# Test API - should not show excluded items
npx tsx scripts/test-deals-api.ts

# Test rotation - should not select excluded items
npx tsx scripts/rotate-happy-hour-product.ts
npx tsx scripts/rotate-flash-sales-product.ts
```

## Adding New Exclusions

To add new excluded categories or products:

1. **Update API route** (`src/app/api/deals/route.ts`):
   - Add to `EXCLUDED_CATEGORIES` array
   - Add to `EXCLUDED_PRODUCT_NAMES` array

2. **Update rotation scripts**:
   - `scripts/rotate-happy-hour-product.ts`
   - `scripts/rotate-flash-sales-product.ts`
   - Add to same arrays in both files

3. **Test**:
   - Run test script to verify exclusion
   - Check deals page to ensure excluded items don't appear

## Notes

- Exclusions are case-insensitive
- Product name exclusions use partial matching (contains)
- Category exclusions use exact matching (case-insensitive)
- All filtering happens server-side for security

