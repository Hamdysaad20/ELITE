# Deal Types Reference Guide

This document lists all possible deal types that can be automatically displayed on the `/deals` page, along with their configurations, durations, and time restrictions.

## Deal Categories

### 1. **Time-Based Deals** (Recurring)

#### 1.1 Monday Morning Deals
- **Type**: Fixed prices on specific products
- **Duration**: Recurring weekly
- **Time Window**: Monday 8:00 AM - 1:00 PM
- **Odoo Config**: Pricelist with fixed prices
- **Time Validation**: Application layer (Monday 8 AM - 1 PM)
- **Example**: Iced Latte, Hot Latte → 40 EGP (Monday mornings only)

#### 1.2 Happy Hour Deals
- **Type**: Percentage or fixed discount
- **Duration**: Recurring daily
- **Time Window**: 3:00 PM - 6:00 PM (any day)
- **Odoo Config**: Pricelist with percentage/fixed prices
- **Time Validation**: Application layer (daily 3 PM - 6 PM)
- **Example**: 20% off all beverages (afternoon)

#### 1.3 Weekend Specials
- **Type**: Category or product discounts
- **Duration**: Recurring weekly
- **Time Window**: Saturday & Sunday (all day)
- **Odoo Config**: Pricelist with category/product rules
- **Time Validation**: Application layer (weekend days)
- **Example**: 15% off pastries (weekends only)

#### 1.4 Early Bird Deals
- **Type**: Fixed prices or percentage
- **Duration**: Recurring daily
- **Time Window**: 6:00 AM - 9:00 AM (weekdays)
- **Odoo Config**: Pricelist with rules
- **Time Validation**: Application layer (weekdays 6 AM - 9 AM)
- **Example**: Breakfast items at special prices

#### 1.5 Late Night Deals
- **Type**: Percentage discount
- **Duration**: Recurring daily
- **Time Window**: 9:00 PM - 11:00 PM
- **Odoo Config**: Pricelist with percentage
- **Time Validation**: Application layer (daily 9 PM - 11 PM)
- **Example**: 25% off remaining items (late night)

---

### 2. **Date Range Deals** (One-Time or Seasonal)

#### 2.1 Flash Sales
- **Type**: Percentage or fixed discount
- **Duration**: 24-72 hours
- **Time Window**: Specific start/end date-time
- **Odoo Config**: Pricelist with date_from/date_to
- **Time Validation**: Odoo native (date_from/date_to fields)
- **Example**: 50% off selected items (this weekend only)

#### 2.2 Seasonal Promotions
- **Type**: Category-wide discounts
- **Duration**: 1-4 weeks
- **Time Window**: Specific date range
- **Odoo Config**: Pricelist with date range
- **Time Validation**: Odoo native
- **Example**: Summer drinks promotion (June-August)

#### 2.3 Holiday Specials
- **Type**: Themed product discounts
- **Duration**: 1-7 days
- **Time Window**: Holiday dates
- **Odoo Config**: Pricelist with date range
- **Time Validation**: Odoo native
- **Example**: Christmas special menu (Dec 20-27)

#### 2.4 New Product Launch
- **Type**: Introductory pricing
- **Duration**: 1-2 weeks
- **Time Window**: Launch date range
- **Odoo Config**: Pricelist with date range
- **Time Validation**: Odoo native
- **Example**: New flavor launch discount

---

### 3. **Percentage-Based Deals** (Always Active)

#### 3.1 Global Percentage Discount
- **Type**: Percentage off all products
- **Duration**: Continuous (until deactivated)
- **Time Window**: Always active
- **Odoo Config**: Pricelist with global percentage rule
- **Time Validation**: None (always active)
- **Example**: 30% discount on everything

#### 3.2 Category Percentage Discount
- **Type**: Percentage off specific category
- **Duration**: Continuous
- **Time Window**: Always active
- **Odoo Config**: Pricelist with category percentage rule
- **Time Validation**: None
- **Example**: 20% off all coffee drinks

#### 3.3 Product-Specific Percentage
- **Type**: Percentage off specific products
- **Duration**: Continuous
- **Time Window**: Always active
- **Odoo Config**: Pricelist with product percentage rules
- **Time Validation**: None
- **Example**: 15% off premium items

---

### 4. **Fixed Price Deals** (Always Active)

#### 4.1 Product Fixed Prices
- **Type**: Fixed price for specific products
- **Duration**: Continuous
- **Time Window**: Always active
- **Odoo Config**: Pricelist with product fixed_price rules
- **Time Validation**: None
- **Example**: Espresso always 25 EGP (deal price)

#### 4.2 Category Fixed Prices
- **Type**: Fixed price for category
- **Duration**: Continuous
- **Time Window**: Always active
- **Odoo Config**: Pricelist with category fixed_price rules
- **Time Validation**: None
- **Example**: All pastries at 30 EGP

---

### 5. **Combination Deals** (Complex)

#### 5.1 Buy X Get Y
- **Type**: Quantity-based discount
- **Duration**: Continuous or time-limited
- **Time Window**: Configurable
- **Odoo Config**: Pricelist with quantity rules
- **Time Validation**: Optional
- **Example**: Buy 2 get 1 free

#### 5.2 Volume Discounts
- **Type**: Discount based on quantity
- **Duration**: Continuous
- **Time Window**: Always active
- **Odoo Config**: Pricelist with quantity-based percentage
- **Time Validation**: None
- **Example**: 10% off orders over 200 EGP

#### 5.3 Combo Deals
- **Type**: Bundle pricing
- **Duration**: Continuous or promotional
- **Time Window**: Configurable
- **Odoo Config**: Pricelist with product combinations
- **Time Validation**: Optional
- **Example**: Coffee + Pastry combo price

---

### 6. **Customer Segment Deals** (Targeted)

#### 6.1 VIP Member Discounts
- **Type**: Percentage for VIP customers
- **Duration**: Continuous
- **Time Window**: Always active (for VIP)
- **Odoo Config**: Pricelist assigned to VIP partners
- **Time Validation**: None (partner-based)
- **Example**: 25% off for VIP members

#### 6.2 New Customer Discount
- **Type**: First-order discount
- **Duration**: One-time per customer
- **Time Window**: Always active (for new customers)
- **Odoo Config**: Pricelist for new partners
- **Time Validation**: None (partner-based)
- **Example**: 20% off first order

#### 6.3 Loyalty Tier Discounts
- **Type**: Tier-based percentage
- **Duration**: Continuous (per tier)
- **Time Window**: Always active (per tier)
- **Odoo Config**: Multiple pricelists per tier
- **Time Validation**: None (partner-based)
- **Example**: Gold tier gets 15% off

---

## Deal Configuration Matrix

| Deal Type | Duration | Time Window | Odoo Config | Time Validation |
|-----------|----------|-------------|-------------|-----------------|
| Monday Morning | Recurring weekly | Mon 8 AM - 1 PM | Fixed prices | Application layer |
| Happy Hour | Recurring daily | 3 PM - 6 PM daily | Percentage | Application layer |
| Weekend Specials | Recurring weekly | Sat-Sun all day | Category rules | Application layer |
| Early Bird | Recurring daily | 6 AM - 9 AM weekdays | Rules | Application layer |
| Late Night | Recurring daily | 9 PM - 11 PM | Percentage | Application layer |
| Flash Sale | 24-72 hours | Specific dates | Date range | Odoo native |
| Seasonal | 1-4 weeks | Date range | Date range | Odoo native |
| Holiday | 1-7 days | Holiday dates | Date range | Odoo native |
| Global % | Continuous | Always | Global rule | None |
| Category % | Continuous | Always | Category rule | None |
| Product Fixed | Continuous | Always | Product rule | None |
| Category Fixed | Continuous | Always | Category rule | None |
| Buy X Get Y | Continuous/Promo | Configurable | Quantity rules | Optional |
| Volume Discount | Continuous | Always | Quantity rules | None |
| VIP Discount | Continuous | Always (VIP) | Partner-based | None |
| New Customer | One-time | Always (new) | Partner-based | None |

---

## Recommended Deals for Your Café

Based on common café practices, here are recommended deals:

### **High Priority (Recommended)**
1. **Monday Morning Deals** ✅ (Already implemented)
   - Fixed prices on popular items
   - Monday 8 AM - 1 PM
   - Recurring weekly

2. **Happy Hour** 
   - 20% off beverages
   - Daily 3 PM - 6 PM
   - Recurring daily

3. **Weekend Specials**
   - 15% off pastries
   - Saturday & Sunday
   - Recurring weekly

### **Medium Priority**
4. **Flash Sales**
   - 30-50% off selected items
   - 24-48 hour duration
   - One-time promotions

5. **Seasonal Promotions**
   - Themed menu items
   - 2-4 week duration
   - Seasonal dates

6. **Global Percentage**
   - 10-20% off everything
   - Continuous (when active)
   - Always visible

### **Low Priority (Advanced)**
7. **Early Bird**
   - Breakfast specials
   - Weekdays 6 AM - 9 AM
   - Recurring daily

8. **VIP Member Discounts**
   - 15-25% off for VIP
   - Continuous (partner-based)
   - Always active for VIP

---

## Implementation Notes

### Time Validation Methods

1. **Application Layer** (Current for Monday Deals)
   - Validated in `src/lib/deals/timeValidation.ts`
   - Good for: Recurring time-based deals
   - Pros: Flexible, easy to modify
   - Cons: Requires code changes for new time windows

2. **Odoo Native** (Recommended for date ranges)
   - Uses `date_from` and `date_to` fields on pricelist items
   - Good for: Date range deals, flash sales
   - Pros: Managed in Odoo, no code changes needed
   - Cons: Less flexible for recurring patterns

3. **Hybrid Approach** (Best)
   - Use Odoo for date ranges
   - Use application layer for recurring time windows
   - Combine both for complex deals

### Pricelist Configuration in Odoo

For each deal type, create a pricelist with:
- **Name**: Descriptive (e.g., "Monday Morning Deals", "Happy Hour 20% Off")
- **Active**: True (when deal is active)
- **Items**: 
  - Product-specific rules (for specific products)
  - Category rules (for category-wide deals)
  - Global rules (for all products)
- **Date Range** (if applicable): date_from / date_to on items

---

## Selection Guide

**For automatic display on `/deals` page, select deals that:**
- ✅ Have clear value proposition (discounts, special prices)
- ✅ Are time-limited or promotional (not base pricing)
- ✅ Are active and relevant to customers
- ✅ Have products that match your catalog

**Skip deals that are:**
- ❌ Base/default pricing (like "Default" pricelist)
- ❌ Internal/administrative pricelists
- ❌ Partner-specific (VIP-only, unless you want to show them)
- ❌ Inactive or expired

---

## Next Steps

1. **Review this list** and select which deals you want
2. **Create pricelists in Odoo** for selected deals
3. **Configure time windows** (if applicable)
4. **Test on `/deals` page** - they'll appear automatically!

The system will automatically:
- Fetch all active pricelists
- Apply rules to products
- Display them on the deals page
- Calculate savings and show price comparisons

