# Deals Discount Rules

## Business Rules

### 1. Maximum Discount Limit
**No deal can exceed 40% discount.**

This is a hard limit enforced at multiple levels:
- API validation (`src/server/utils/deals/discountValidation.ts`)
- Rotation scripts (`scripts/rotate-flash-sales-product.ts`)
- Pricelist creation scripts (`scripts/create-flash-sales-pricelist.ts`)

### 2. Large Item Discount Rule
**Discounts above 30% are only allowed for "large items".**

**Large items are defined as:**
- Products with price >= 100 EGP, OR
- Products that have a "Large" size option

**Regular items (price < 100 EGP, no Large size):**
- Maximum discount: 30%

**Large items (price >= 100 EGP or has Large size):**
- Maximum discount: 40%

## Implementation

### Validation Functions

Located in `src/server/utils/deals/discountValidation.ts`:

- `isLargeItem(product)`: Checks if product qualifies as large item
- `validateDiscount(percentage, product)`: Validates discount against rules
- `clampDiscount(percentage, product)`: Clamps discount to valid range

### API Enforcement

The `/api/deals` endpoint automatically validates and clamps discounts:
- Product-specific discounts
- Category-based discounts
- Global discounts

All discounts are validated before being returned to the client.

### Script Enforcement

**Rotation Scripts:**
- `rotate-flash-sales-product.ts`: Automatically selects appropriate discount based on product price
- `rotate-happy-hour-product.ts`: Uses fixed 20% discount (within limits)

**Creation Scripts:**
- `create-flash-sales-pricelist.ts`: Validates discount on creation
- All scripts enforce the 40% maximum

## Examples

### Valid Discounts

✅ **Regular Item (80 EGP):**
- 20% discount ✅
- 30% discount ✅
- 35% discount ❌ (clamped to 30%)

✅ **Large Item (120 EGP):**
- 20% discount ✅
- 30% discount ✅
- 35% discount ✅
- 40% discount ✅
- 45% discount ❌ (clamped to 40%)

### Invalid Discounts

❌ **Any item:**
- 41% discount → Clamped to 40%
- 50% discount → Clamped to 40%

❌ **Regular item:**
- 31% discount → Clamped to 30%
- 35% discount → Clamped to 30%

## Testing

Test discount validation:
```bash
# Test API with various discounts
npx tsx scripts/test-deals-api.ts

# Test rotation (will automatically respect rules)
npx tsx scripts/rotate-flash-sales-product.ts
```

## Configuration

Constants defined in scripts:
- `MAX_DISCOUNT = 40` (maximum discount percentage)
- `LARGE_ITEM_MIN_PRICE = 100` (price threshold for large items)

## Notes

- All validation happens server-side for security
- Discounts are clamped, not rejected (prevents breaking existing deals)
- Warnings are logged when discounts are adjusted
- Rules apply to all deal types (Flash Sales, Happy Hour, etc.)

