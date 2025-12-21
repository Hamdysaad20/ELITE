# Deals Implementation Plan - Production Ready

## Overview

This document outlines the production-ready implementation plan for all deals, focusing on:
- **Server-side time validation** (accurate, secure)
- **Percentage-based discounts** (flexible, maintainable)
- **Automated synchronization** (POS and website)
- **Production best practices**

---

## Key Principles

### 1. Server-Side Time Validation
- ✅ All time validation happens on the server (API route)
- ✅ Client only displays what server provides
- ✅ Prevents time manipulation attacks
- ✅ Uses proper timezone handling (Egypt/Cairo)

### 2. Percentage-Based Discounts
- ✅ Convert all fixed prices to percentages
- ✅ Example: If product is 50 EGP and deal price is 40 EGP → 20% discount
- ✅ Formula: `percent_price = ((original_price - deal_price) / original_price) * 100`
- ✅ Benefits:
  - If base price changes, discount percentage stays correct
  - Easier to maintain in Odoo
  - Consistent with POS pricing

### 3. Odoo as Single Source of Truth
- ✅ All prices come from Odoo pricelists
- ✅ Pricelists work automatically in POS and website
- ✅ No hardcoded prices in code
- ✅ Changes in Odoo reflect immediately

### 4. Automation
- ✅ Pricelists configured in Odoo
- ✅ Automatic product rotation (for Happy Hour, Flash Sales)
- ✅ Auto-detection of new products
- ✅ Date-based activation/deactivation

---

## Architecture

### Current Flow (Client-Side Validation) ❌
```
Client (useDeals) 
  → API (/api/deals) 
  → Returns all deals
  → Client validates time (timeValidation.ts)
  → Shows/hides deals
```

**Problems:**
- Time validation on client (can be manipulated)
- Inconsistent timezone handling
- Not production-ready

### New Flow (Server-Side Validation) ✅
```
Client (useDeals)
  → API (/api/deals)
  → Server validates time (server-side)
  → Server calculates deal prices from Odoo
  → Returns only active deals with correct prices
  → Client displays (no validation needed)
```

**Benefits:**
- Secure (server-side validation)
- Accurate (single source of truth)
- Consistent (same logic for POS and website)

---

## Implementation Details

### 1. Server-Side Time Validation

#### Location: `src/server/utils/deals/timeValidation.ts`

```typescript
/**
 * Server-side time validation for deals
 * Uses Egypt/Cairo timezone for accurate validation
 */

import { formatInTimeZone, zonedTimeToUtc } from 'date-fns-tz';

const TIMEZONE = 'Africa/Cairo'; // Egypt timezone

export interface TimeWindow {
  days?: number[]; // 0 = Sunday, 1 = Monday, etc.
  startHour?: number; // 0-23
  startMinute?: number; // 0-59
  endHour?: number; // 0-23
  endMinute?: number; // 0-59
}

/**
 * Check if current time matches the time window
 */
export function isTimeWindowActive(window: TimeWindow, date: Date = new Date()): boolean {
  // Convert to Egypt timezone
  const egyptTime = formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  const [dateStr, timeStr] = egyptTime.split(' ');
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  
  const dayOfWeek = new Date(year, month - 1, day).getDay();
  
  // Check day of week
  if (window.days && !window.days.includes(dayOfWeek)) {
    return false;
  }
  
  // Check time window
  if (window.startHour !== undefined && window.endHour !== undefined) {
    const currentMinutes = hour * 60 + minute;
    const startMinutes = (window.startHour || 0) * 60 + (window.startMinute || 0);
    const endMinutes = (window.endHour || 0) * 60 + (window.endMinute || 0);
    
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  
  return true; // No time restriction
}

/**
 * Deal time windows configuration
 */
export const DEAL_TIME_WINDOWS: Record<string, TimeWindow> = {
  'Monday Morning Deals': {
    days: [1], // Monday
    startHour: 8,
    startMinute: 0,
    endHour: 13,
    endMinute: 0,
  },
  'Happy Hour Deals': {
    days: [0, 1, 2, 3, 4, 5, 6], // All days
    startHour: 15, // 3 PM
    startMinute: 0,
    endHour: 18, // 6 PM
    endMinute: 0,
  },
  'Weekend Specials': {
    days: [6, 0], // Saturday & Sunday
  },
  'Late Night Deals': {
    days: [1, 4], // Monday & Thursday
    startHour: 22, // 10 PM
    startMinute: 0,
    endHour: 0, // 12 AM (midnight)
    endMinute: 0,
  },
  'Flash Sales': {
    days: [0, 1, 2, 3, 4, 5, 6], // All days
    startHour: 14, // 2 PM (example - can be configurable)
    startMinute: 0,
    endHour: 15, // 3 PM (1 hour window)
    endMinute: 0,
  },
};
```

### 2. Percentage Conversion Utility

#### Location: `src/server/utils/deals/priceConversion.ts`

```typescript
/**
 * Convert fixed prices to percentage discounts
 * This ensures discounts remain correct when base prices change
 */

/**
 * Calculate percentage discount from original and deal prices
 */
export function calculateDiscountPercentage(
  originalPrice: number,
  dealPrice: number
): number {
  if (originalPrice <= 0) return 0;
  if (dealPrice >= originalPrice) return 0;
  
  const discount = ((originalPrice - dealPrice) / originalPrice) * 100;
  return Math.round(discount * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate deal price from original price and percentage discount
 */
export function calculateDealPrice(
  originalPrice: number,
  discountPercentage: number
): number {
  if (originalPrice <= 0) return 0;
  if (discountPercentage <= 0) return originalPrice;
  if (discountPercentage >= 100) return 0;
  
  const dealPrice = originalPrice * (1 - discountPercentage / 100);
  return Math.round(dealPrice * 100) / 100; // Round to 2 decimal places
}

/**
 * Example:
 * Original: 50 EGP
 * Deal: 40 EGP
 * Percentage: 20% discount
 * 
 * If original changes to 60 EGP:
 * New deal price: 60 * 0.8 = 48 EGP (still 20% off)
 */
```

### 3. Updated API Route

#### Location: `src/app/api/deals/route.ts`

**Key Changes:**
1. Server-side time validation
2. Filter deals by active status
3. Calculate prices from Odoo pricelists
4. Return only active deals with correct prices

```typescript
// Pseudocode structure:

export async function GET(request: NextRequest) {
  // 1. Get all pricelists from Odoo
  const pricelists = await client.getAllActivePricelists();
  
  // 2. Filter by allowed categories (Coffee, Food, Frappe, etc.)
  const allowedCategories = ['Coffee', 'Food', 'Frappe', 'Iced', 'Milkshake', 'Smoothie', 'Soda', 'Tea'];
  
  // 3. For each pricelist:
  for (const pricelist of pricelists) {
    // a. Get pricelist items
    const items = await client.getPricelistItems(pricelist.id);
    
    // b. Validate time window (server-side)
    const timeWindow = DEAL_TIME_WINDOWS[pricelist.name];
    const isActive = timeWindow 
      ? isTimeWindowActive(timeWindow) 
      : true; // No time restriction = always active
    
    // c. Get products matching pricelist rules
    const dealProducts = await getProductsForPricelist(items, allProducts);
    
    // d. Calculate deal prices from Odoo
    // - If percentage: calculate from original price
    // - If fixed: convert to percentage for future flexibility
    
    // e. Only include if active and has products
    if (isActive && dealProducts.length > 0) {
      deals.push({
        ...pricelist,
        products: dealProducts,
        active: isActive,
      });
    }
  }
  
  return jsonResponse(successResponse({ deals }));
}
```

### 4. Pricelist Creation Scripts

#### Reference: 30% Discount Pricelist

The "30% discount" pricelist uses:
- `compute_price: "percentage"`
- `percent_price: 30`
- Works automatically in POS and website

#### New Scripts Needed:

**1. Happy Hour Deals Script** (`scripts/create-happy-hour-pricelist.ts`)
- Creates pricelist with percentage rules
- Selects random product daily (or manual selection)
- 20% discount

**2. Weekend Specials Script** (`scripts/create-weekend-specials-pricelist.ts`)
- Creates combo products or special prices
- Fixed combo prices (convert to percentage if possible)

**3. Late Night Deals Script** (`scripts/create-late-night-pricelist.ts`)
- Category-based percentage rules
- 15% discount on selected categories

**4. Flash Sales Script** (`scripts/create-flash-sales-pricelist.ts`)
- Daily rotating product
- Percentage discount (30-50%)

**5. Seasonal/Holiday Scripts**
- Date-based pricelists
- Use Odoo's `date_from` / `date_to` fields

---

## Deal-Specific Implementation

### 1. Monday Morning Deals ✅ (Already Implemented)

**Current:** Fixed prices (40 EGP, 25 EGP)
**Change:** Convert to percentages

**Example:**
- Iced Latte: Original 50 EGP → Deal 40 EGP = 20% discount
- Espresso: Original 30 EGP → Deal 25 EGP = 16.67% discount

**Odoo Config:**
```python
# Instead of fixed_price: 40
# Use: compute_price: "percentage", percent_price: 20
```

### 2. Happy Hour Deals

**Implementation:**
- Pricelist: "Happy Hour Deals"
- Type: Product-specific percentage (20%)
- Product: Rotates daily (manual or automated)
- Time: Daily 3 PM - 6 PM (server-side validation)

**Odoo Config:**
```python
pricelist_item = {
    'pricelist_id': happy_hour_pricelist_id,
    'product_id': selected_product_id,  # Rotates daily
    'compute_price': 'percentage',
    'percent_price': 20,
}
```

**Automation:**
- Option A: Manual update daily in Odoo
- Option B: Scheduled script to select random product
- Option C: API endpoint to rotate product

### 3. Weekend Specials (Combo Deals)

**Implementation:**
- Pricelist: "Weekend Specials"
- Type: Combo products OR special prices
- Time: Saturday & Sunday (server-side validation)

**Option A: Combo Products**
- Create combo products in Odoo (e.g., "Latte + Cheese Sandwich Combo")
- Set fixed price: 120 EGP
- Convert to percentage if base combo price exists

**Option B: Special Prices**
- Keep individual products
- Apply special prices on weekends
- Use pricelist with date restrictions

**Odoo Config:**
```python
# Combo product approach
combo_product = {
    'name': 'Latte + Cheese Sandwich Combo',
    'list_price': 120,  # Combo price
    'type': 'product',
}

# OR special price approach
pricelist_item = {
    'product_id': latte_id,
    'compute_price': 'percentage',
    'percent_price': calculated_percentage,  # Based on combo savings
}
```

### 4. Late Night Deals

**Implementation:**
- Pricelist: "Late Night Deals"
- Type: Category-based percentage (15%)
- Categories: Selected from allowed list
- Time: Monday & Thursday, 10 PM - 12 AM

**Odoo Config:**
```python
for category_id in selected_categories:
    pricelist_item = {
        'pricelist_id': late_night_pricelist_id,
        'categ_id': category_id,
        'compute_price': 'percentage',
        'percent_price': 15,
    }
```

### 5. Flash Sales

**Implementation:**
- Pricelist: "Flash Sales"
- Type: Product-specific percentage (30-50%)
- Product: Rotates daily
- Time: 1-hour window daily (e.g., 2 PM - 3 PM)

**Odoo Config:**
```python
pricelist_item = {
    'pricelist_id': flash_sales_pricelist_id,
    'product_id': daily_selected_product_id,
    'compute_price': 'percentage',
    'percent_price': random_between(30, 50),
}
```

### 6. Seasonal Promotions

**Implementation:**
- Pricelist: "Seasonal Promotions [Season]"
- Type: Category or product percentage
- Time: Date range (Odoo native: `date_from` / `date_to`)

**Odoo Config:**
```python
pricelist_item = {
    'pricelist_id': seasonal_pricelist_id,
    'categ_id': category_id,  # or product_id
    'compute_price': 'percentage',
    'percent_price': discount_percentage,
    'date_start': '2024-06-01 00:00:00',
    'date_end': '2024-08-31 23:59:59',
}
```

### 7. Holiday Specials

**Implementation:**
- Pricelist: "Holiday Specials [Holiday]"
- Type: Product-specific with special configurations
- Time: Holiday date range

**Special Configurations:**
- May need product variants (e.g., "Coffee with Marshmallow")
- Or use product attributes/options

**Odoo Config:**
```python
# Create variant or use attributes
holiday_product = {
    'name': 'Holiday Special Coffee',
    'list_price': special_price,
    # Add attributes for special configurations
}
```

### 8. New Product Launch

**Implementation:**
- Pricelist: "New Product Launch"
- Type: Auto-detected products (created within 7 days)
- Discount: Percentage (e.g., 20%)

**Auto-Detection Logic:**
```typescript
// In API route or scheduled job
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const newProducts = await client.searchRead(
  'product.product',
  [
    ['create_date', '>=', format(sevenDaysAgo, 'yyyy-MM-dd HH:mm:ss')],
    ['categ_id', 'in', allowedCategoryIds],
  ],
  ['id', 'name']
);

// Auto-add to pricelist
for (const product of newProducts) {
  await addProductToPricelist(
    'New Product Launch',
    product.id,
    { compute_price: 'percentage', percent_price: 20 }
  );
}
```

### 9. Elite Yearly University Event

**Implementation:**
- Pricelist: "Elite Yearly University Event"
- Type: Global percentage (all products)
- Time: June 1st annually

**Odoo Config:**
```python
pricelist_item = {
    'pricelist_id': yearly_event_pricelist_id,
    # No product_id or categ_id = global
    'compute_price': 'percentage',
    'percent_price': 25,  # Example: 25% off
    'date_start': '2024-06-01 00:00:00',
    'date_end': '2024-06-01 23:59:59',
}
```

**Note:** Update date range annually or use recurring pattern.

### 10. Combination Deals

**Implementation:**
- Pricelist: "Combination Deals"
- Type: Combo products OR cart-level rules
- Time: Always active or date-based

**Option A: Combo Products** (Recommended)
- Create combo products in Odoo
- Set bundle prices
- Convert to percentage if base combo price exists

**Option B: Cart Rules**
- Odoo sale rules (if available)
- Apply discount when specific items in cart

---

## Automation Strategy

### 1. Product Rotation (Happy Hour, Flash Sales)

**Option A: Scheduled Script**
```typescript
// scripts/rotate-daily-deals.ts
// Run daily via cron

async function rotateHappyHourProduct() {
  const eligibleProducts = await getEligibleProducts(allowedCategories);
  const randomProduct = selectRandom(eligibleProducts);
  
  await updatePricelistItem(
    'Happy Hour Deals',
    { product_id: randomProduct.id }
  );
}
```

**Option B: API Endpoint**
```typescript
// POST /api/admin/deals/rotate
// Manual trigger or automated call
```

**Option C: Odoo Automation**
- Use Odoo's automation rules
- Scheduled actions to update pricelist items

### 2. New Product Detection

**Scheduled Job:**
```typescript
// scripts/detect-new-products.ts
// Run every hour or daily

async function detectAndAddNewProducts() {
  const newProducts = await getProductsCreatedInLast7Days();
  
  for (const product of newProducts) {
    await addToPricelist('New Product Launch', product.id, {
      compute_price: 'percentage',
      percent_price: 20,
    });
  }
  
  // Remove products older than 7 days
  await removeOldProductsFromPricelist('New Product Launch');
}
```

### 3. Date-Based Activation

**Odoo Native:**
- Use `date_from` / `date_to` on pricelist items
- Odoo automatically activates/deactivates
- No code needed

---

## POS Integration

### How Pricelists Work in POS

1. **Assign Pricelist to POS Config:**
   - In Odoo: POS Config → Pricelist
   - Select the deal pricelist
   - POS automatically uses pricelist prices

2. **Multiple Pricelists:**
   - POS can have multiple pricelists
   - Customer/order can select pricelist
   - Or use default pricelist

3. **Automatic Sync:**
   - When pricelist changes in Odoo
   - POS automatically reflects changes
   - No manual sync needed

### Best Practice

**Create separate pricelists for deals:**
- "Monday Morning Deals"
- "Happy Hour Deals"
- "Weekend Specials"
- etc.

**Then assign to POS:**
- Option A: Multiple pricelists in POS config
- Option B: Switch pricelist based on time/day
- Option C: Use default pricelist + deal pricelists

---

## Migration Plan

### Phase 1: Foundation (Week 1)
1. ✅ Create server-side time validation utility
2. ✅ Create price conversion utility
3. ✅ Update API route with server-side validation
4. ✅ Test with existing Monday Morning Deals

### Phase 2: Percentage Conversion (Week 1-2)
1. Convert Monday Morning Deals to percentages
2. Update Odoo pricelist
3. Test price calculations
4. Verify POS integration

### Phase 3: New Deals (Week 2-3)
1. Implement Happy Hour Deals
2. Implement Weekend Specials
3. Implement Late Night Deals
4. Test each deal type

### Phase 4: Advanced Features (Week 3-4)
1. Flash Sales with rotation
2. Seasonal Promotions
3. Holiday Specials
4. New Product Launch auto-detection

### Phase 5: Automation (Week 4)
1. Product rotation scripts
2. New product detection
3. Scheduled jobs
4. Monitoring and alerts

---

## Testing Checklist

### Time Validation
- [ ] Monday Morning: Active Monday 8 AM - 1 PM only
- [ ] Happy Hour: Active daily 3 PM - 6 PM
- [ ] Weekend Specials: Active Saturday & Sunday only
- [ ] Late Night: Active Monday & Thursday 10 PM - 12 AM
- [ ] Flash Sales: Active during 1-hour window
- [ ] Date-based: Active during date range only

### Price Calculations
- [ ] Percentage discounts calculate correctly
- [ ] Fixed prices converted to percentages
- [ ] Prices match Odoo pricelist
- [ ] POS shows same prices as website

### Category Filtering
- [ ] Only allowed categories included
- [ ] Other categories excluded
- [ ] Category-based rules work correctly

### Automation
- [ ] Product rotation works
- [ ] New product detection works
- [ ] Date-based activation works
- [ ] Scheduled jobs run correctly

---

## Monitoring & Maintenance

### Logging
- Log all deal activations/deactivations
- Log price calculations
- Log time validation results
- Log automation runs

### Alerts
- Alert if pricelist not found
- Alert if no products in deal
- Alert if time validation fails
- Alert if automation fails

### Regular Tasks
- Review deal performance
- Update seasonal promotions
- Rotate flash sale products
- Check new product detection

---

## Success Criteria

✅ All deals use percentage-based discounts
✅ All time validation is server-side
✅ Prices sync automatically between POS and website
✅ Deals activate/deactivate automatically
✅ No hardcoded prices in code
✅ Category filtering works correctly
✅ Automation runs reliably
✅ Production-ready and maintainable

