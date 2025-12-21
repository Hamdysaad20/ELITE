# Deals Requirements & Implementation Plan

## Overview

This document defines the specific deals to be implemented for the ELITE café website, including their configurations, time windows, product restrictions, and implementation approach.

---

## Deal Categories Allowed

**ONLY these categories are eligible for deals:**
- Coffee
- Food
- Frappe
- Iced
- Milkshake
- Smoothie
- Soda
- Tea

**All other categories are excluded from deals.**

---

## 1. Monday Morning Deals ✅ (Already Implemented)

### Description
Fixed prices on specific coffee products every Monday morning.

### Configuration
- **Duration**: Recurring weekly
- **Time Window**: Monday 8:00 AM - 1:00 PM
- **Products**: 
  - Iced Latte, Hot Latte, Iced Cappuccino, Hot Cappuccino → 40 EGP
  - Espresso, Turkish Coffee → 25 EGP
- **Category**: Coffee only
- **Type**: Fixed prices (product-specific)
- **Odoo Config**: Pricelist "Monday Morning Deals" with fixed_price rules
- **Time Validation**: Application layer (`src/lib/deals/timeValidation.ts`)

### Status
✅ **IMPLEMENTED** - Working as expected

---

## 2. Happy Hour Deals

### Description
Daily rotating deal: One random item gets 20% discount during happy hour.

### Configuration
- **Duration**: Recurring daily
- **Time Window**: 3:00 PM - 6:00 PM (every day)
- **Discount**: 20% off
- **Product Selection**: 
  - Random item selected daily
  - Must be from allowed categories (Coffee, Food, Frappe, Iced, Milkshake, Smoothie, Soda, Tea)
  - Item changes each day (rotating selection)
- **Type**: Percentage discount (product-specific, rotating)
- **Odoo Config**: 
  - Pricelist "Happy Hour Deals"
  - Product-specific percentage rules (20%)
  - Product selection updated daily (manual or automated)
- **Time Validation**: Application layer (daily 3 PM - 6 PM)

### Implementation Notes
- Need mechanism to rotate/select random product daily
- Could use scheduled job or manual update
- Display should show which product is on deal today

---

## 3. Weekend Specials (Combo Deals)

### Description
Weekend-only combo deals pairing complementary items at special bundle prices.

### Configuration
- **Duration**: Recurring weekly
- **Time Window**: Saturday & Sunday (all day, both days)
- **Type**: Fixed combo prices
- **Category**: Food + Coffee combinations
- **Examples**:
  - Latte + Cheese Sandwich = 120 EGP
  - Cappuccino + Croissant = 80 EGP
  - Iced Coffee + Sandwich = 100 EGP
- **Odoo Config**: 
  - Pricelist "Weekend Specials"
  - Product-specific fixed prices for combo items
  - OR: Special combo products created in Odoo
- **Time Validation**: Application layer (Saturday & Sunday)

### Implementation Notes
- Combo items can be:
  - **Option A**: Individual products with special weekend prices (when bought together)
  - **Option B**: New "combo" products in Odoo that represent the bundle
- Frontend should show combo clearly (e.g., "Latte + Cheese Sandwich Combo")
- Cart should handle combo pricing correctly

---

## 4. Late Night Deals

### Description
Category-based discount during late night hours on specific days.

### Configuration
- **Duration**: Recurring weekly
- **Time Window**: 10:00 PM - 12:00 AM (midnight)
- **Days**: Thursday and Monday
- **Discount**: 15% off
- **Categories**: 
  - Select specific categories from allowed list
  - Example: Coffee, Iced, Tea (15% off during late night)
- **Type**: Category-based percentage discount
- **Odoo Config**: 
  - Pricelist "Late Night Deals"
  - Category-based percentage rules (15%)
  - Applied to selected categories only
- **Time Validation**: Application layer (Thursday & Monday, 10 PM - 12 AM)

### Implementation Notes
- Categories to include: TBD (select from allowed list)
- Time validation needs to check both day (Thu/Mon) and time (10 PM - 12 AM)

---

## 5. Flash Sales

### Description
Daily one-hour flash sale on a randomly selected item.

### Configuration
- **Duration**: 1 hour per day
- **Time Window**: 
  - Random 1-hour window each day
  - OR: Fixed time (e.g., 2:00 PM - 3:00 PM daily)
  - TBD: Which approach to use
- **Discount**: Variable (e.g., 30-50% off)
- **Product Selection**: 
  - One random item selected daily
  - Must be from allowed categories
  - Item changes each day
- **Type**: Product-specific percentage discount (rotating)
- **Odoo Config**: 
  - Pricelist "Flash Sales"
  - Product-specific percentage rules
  - Product updated daily
- **Time Validation**: Application layer (1-hour window daily)

### Implementation Notes
- Need daily product rotation mechanism
- Time window can be fixed (easier) or random (more complex)
- Display should show countdown timer for remaining time
- High urgency messaging ("Limited time!")

---

## 6. Seasonal Promotions

### Description
Themed promotions that run for extended periods (weeks/months) based on seasons.

### Configuration
- **Duration**: 2-4 weeks (seasonal periods)
- **Time Window**: Specific date ranges
  - Summer: June-August
  - Winter: December-February
  - Spring: March-May
  - Fall: September-November
- **Type**: Category or product discounts
- **Discount**: Variable (e.g., 15-25% off)
- **Categories**: Selected from allowed categories
- **Odoo Config**: 
  - Pricelist "Seasonal Promotions [Season Name]"
  - Category or product rules
  - Date range: date_from / date_to fields
- **Time Validation**: Odoo native (date_from/date_to)

### Implementation Notes
- Create separate pricelists per season
- Use Odoo's date_from/date_to for automatic activation/deactivation
- Examples:
  - Summer: Iced drinks, Smoothies, Soda promotions
  - Winter: Hot Coffee, Tea, Hot Chocolate promotions

---

## 7. Holiday Specials

### Description
Special themed products with specific configurations during holidays.

### Configuration
- **Duration**: 1-7 days (holiday period)
- **Time Window**: Holiday dates
  - Examples: Christmas (Dec 20-27), New Year (Dec 31 - Jan 2), Eid, etc.
- **Type**: Product-specific with special configurations
- **Products**: 
  - Specific products with special add-ons/configurations
  - Example: Marshmallow topping, special flavors, themed items
- **Discount**: Variable or fixed prices
- **Odoo Config**: 
  - Pricelist "Holiday Specials [Holiday Name]"
  - Product-specific rules
  - Date range: date_from / date_to
- **Time Validation**: Odoo native (date_from/date_to)

### Implementation Notes
- Products may have special attributes/configurations (e.g., marshmallow topping)
- May need to create variant products in Odoo for special configurations
- Display should highlight holiday theme

---

## 8. New Product Launch

### Description
Automatic discount for newly added products during their first week.

### Configuration
- **Duration**: 1 week (7 days from product creation)
- **Time Window**: Automatically detected (product creation date + 7 days)
- **Discount**: Variable (e.g., 20% off)
- **Product Selection**: 
  - Automatically detect new products
  - Products created within last 7 days
  - Must be from allowed categories
- **Type**: Product-specific percentage discount (auto-detected)
- **Odoo Config**: 
  - Pricelist "New Product Launch"
  - Product-specific percentage rules
  - Auto-updated based on product creation_date
- **Time Validation**: Odoo native (based on product.create_date)

### Implementation Notes
- Need to query products by creation date
- Filter: `create_date >= (today - 7 days)`
- Automatically add/remove products from pricelist
- May need scheduled job to update pricelist items

---

## 9. Elite Yearly University Event

### Description
Special annual event with global percentage discount for one day.

### Configuration
- **Duration**: 1 day per year
- **Time Window**: June 1st (annually)
- **Discount**: Global percentage (TBD: e.g., 25% off everything)
- **Type**: Global percentage discount
- **Categories**: All allowed categories
- **Odoo Config**: 
  - Pricelist "Elite Yearly University Event"
  - Global percentage rule
  - Date range: June 1st (recurring annually)
- **Time Validation**: Odoo native (date_from/date_to, yearly)

### Implementation Notes
- Single day event
- Applies to all products in allowed categories
- Annual recurrence (update date range each year or use yearly pattern)

---

## 10. Combination Deals

### Description
Bundle deals combining multiple items at special prices.

### Configuration
- **Duration**: Continuous or promotional periods
- **Time Window**: Always active OR specific date ranges
- **Type**: Fixed bundle prices
- **Examples**:
  - Coffee + Pastry combo
  - Drink + Food item combo
  - Multiple items bundle
- **Odoo Config**: 
  - Option A: Create combo products in Odoo
  - Option B: Pricelist with special prices when items are combined
  - Option C: Cart-level discount rules
- **Time Validation**: Optional (can be always active or time-limited)

### Implementation Notes
- Can be implemented as:
  - **Combo Products**: New products in Odoo representing bundles
  - **Cart Rules**: Discount applied when specific items are in cart
  - **Pricelist Rules**: Special prices for product combinations
- Frontend should clearly show bundle savings
- Examples:
  - "Coffee + Pastry Combo: 80 EGP (Save 15 EGP)"
  - "Lunch Combo: Sandwich + Drink + Dessert = 150 EGP"

---

## Implementation Priority

### Phase 1: Quick Wins (Easy to Implement)
1. ✅ Monday Morning Deals (Already done)
2. Late Night Deals (Category-based, similar to Monday)
3. Weekend Specials (Combo deals - can use fixed prices)

### Phase 2: Medium Complexity
4. Happy Hour Deals (Need daily product rotation)
5. Flash Sales (Need daily product rotation + time window)
6. Seasonal Promotions (Date range, straightforward)

### Phase 3: Advanced Features
7. Holiday Specials (Product variants/configurations)
8. New Product Launch (Auto-detection logic)
9. Elite Yearly University Event (Annual date handling)
10. Combination Deals (Cart-level or combo products)

---

## Technical Requirements

### Time Validation

**Application Layer** (for recurring patterns):
- Monday Morning: Monday 8 AM - 1 PM
- Happy Hour: Daily 3 PM - 6 PM
- Weekend Specials: Saturday & Sunday
- Late Night: Thursday & Monday, 10 PM - 12 AM
- Flash Sales: 1-hour window daily

**Odoo Native** (for date ranges):
- Seasonal Promotions: date_from / date_to
- Holiday Specials: date_from / date_to
- Elite Yearly Event: date_from / date_to (June 1st)

### Product Selection Logic

**Random/Rotating Products** (Happy Hour, Flash Sales):
- Need mechanism to select/rotate products daily
- Options:
  - Manual update in Odoo
  - Scheduled script to update pricelist items
  - Random selection from eligible products

**Auto-Detection** (New Product Launch):
- Query products by `create_date`
- Filter: `create_date >= (today - 7 days)`
- Auto-add to pricelist

### Category Filtering

**Always filter by allowed categories:**
- Coffee, Food, Frappe, Iced, Milkshake, Smoothie, Soda, Tea
- Exclude all other categories from deals

---

## Odoo Pricelist Structure

### Recommended Pricelist Names:
1. "Monday Morning Deals" ✅
2. "Happy Hour Deals"
3. "Weekend Specials"
4. "Late Night Deals"
5. "Flash Sales"
6. "Seasonal Promotions [Season]"
7. "Holiday Specials [Holiday]"
8. "New Product Launch"
9. "Elite Yearly University Event"
10. "Combination Deals"

### Pricelist Item Types:
- **Product-specific**: `product_id` set, `fixed_price` or `percent_price`
- **Category-based**: `categ_id` set, `fixed_price` or `percent_price`
- **Global**: No `product_id` or `categ_id`, `percent_price` (for Elite Yearly Event)

---

## Frontend Display Requirements

### Deal Cards Should Show:
1. Deal name
2. Time window / availability
3. Discount type (percentage or fixed price)
4. Number of products included
5. Savings information
6. Active/inactive status

### Product Cards in Deals Should Show:
1. Original price (strikethrough)
2. Deal price (highlighted)
3. Savings amount/percentage
4. Availability status (if time-restricted)
5. Clear "Deal" badge

---

## Next Steps

1. **Review and approve** this requirements document
2. **Prioritize** which deals to implement first
3. **Create pricelists in Odoo** for selected deals
4. **Implement time validation** for recurring deals
5. **Build product rotation logic** for Happy Hour and Flash Sales
6. **Test each deal type** on `/deals` page
7. **Monitor and adjust** based on performance

---

## Questions to Resolve

1. **Happy Hour**: 
   - Fixed time (3-6 PM) or random time each day?
   - How to select random product? (Manual daily update or automated?)

2. **Flash Sales**: 
   - Fixed 1-hour window or random? 
   - If fixed, which hour? (e.g., 2:00 PM - 3:00 PM)
   - How to select random product daily?

3. **Late Night Categories**: 
   - Which categories get 15% off? 
   - Select from: Coffee, Food, Frappe, Iced, Milkshake, Smoothie, Soda, Tea

4. **Weekend Combos**: 
   - Specific combo items to create?
   - Examples needed:
     - Latte + Cheese Sandwich = 120 EGP
     - [List more combos]

5. **Seasonal Promotions**: 
   - Which seasons/categories?
   - Summer: Which categories? (Iced, Smoothie, Soda?)
   - Winter: Which categories? (Coffee, Tea, Hot drinks?)
   - Spring/Fall: Which categories?

6. **Holiday Specials**: 
   - Which holidays to support? (Christmas, New Year, Eid, etc.)
   - Which products need special configurations?
   - Example: Marshmallow topping - how to configure?

7. **New Product Launch**: 
   - Discount percentage? (e.g., 20%?)
   - Auto-detect or manual selection?

8. **Elite Yearly Event**: 
   - Discount percentage? (e.g., 25% off everything?)
   - Confirm: June 1st every year?

9. **Combination Deals**: 
   - Specific combos to create?
   - Examples needed beyond weekend combos

---

## Success Criteria

✅ All selected deals appear on `/deals` page
✅ Time restrictions work correctly
✅ Products filter correctly by allowed categories
✅ Prices calculate correctly (Odoo is source of truth)
✅ Deals show clear savings information
✅ Add-to-cart works with deal prices
✅ Time validation prevents ordering outside valid windows

