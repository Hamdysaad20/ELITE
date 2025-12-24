# Deals System - Bugs & Enhancements Implementation Plan

**Date:** December 2024  
**Status:** Investigation Complete, Ready for Implementation

---

## 🔍 Investigation Summary

### Issues Identified

1. **❌ Bug: Multiple Seasonal Promotions Showing Simultaneously**
   - **Symptom:** Summer, Fall, Spring, Winter promotions all showing at once when it's Winter
   - **Root Cause:** Seasonal promotions script sets `date_start: null` and `date_end: null` on pricelist items, but API checks these fields
   - **Location:** `scripts/create-seasonal-promotions-pricelist.ts` (lines 151-152)
   - **Impact:** Users see inactive seasonal deals, causing confusion

2. **❌ Bug: Deals Not Using Proper Card Styling**
   - **Symptom:** Deals not showing discount percentage, original scratched price, and deal price properly
   - **Root Cause:** 
     - ✅ Verified: `dealInfo` is being passed correctly to `DrinkCard` (lines 294-300 in `src/app/deals/page.tsx`)
     - ⚠️ Likely Issue: Seasonal promotions showing with incorrect data because date validation bug causes all to be active
     - ⚠️ Possible Issue: Category-based percentage discounts may not be calculating `savings`/`savingsPercent` correctly
   - **Location:** `src/app/deals/page.tsx` and `src/app/api/deals/route.ts`
   - **Impact:** Poor user experience, unclear savings information

3. **⚠️ Enhancement: Enhanced Deal Discovery API**
   - **Status:** Not implemented
   - **Requirement:** Create `/api/v1/deals/discovery` endpoint with enhanced schema
   - **Impact:** Better API for future mobile apps and integrations

4. **⚠️ Enhancement: Odoo 19 Native Combo Integration**
   - **Status:** Partially implemented (only detects Weekend Specials combos)
   - **Requirement:** Use Odoo 19 native combo products (`product.template` type: `combo`)
   - **Impact:** Better combo management, native Odoo support

---

## 📋 Implementation Plan

### Phase 1: Fix Seasonal Promotions Date Validation (High Priority)

#### Problem
The seasonal promotions script creates pricelist items with `date_start: null` and `date_end: null`, but the API checks these fields to filter active deals. This causes all seasonal promotions to show regardless of current date.

#### Solution
Update the seasonal promotions script to set date ranges on pricelist items.

#### Tasks
1. **Update `scripts/create-seasonal-promotions-pricelist.ts`**
   - Set `date_start` and `date_end` on each pricelist item based on seasonal config
   - Update `createCategoryRules` function to accept date range parameters
   - Pass `dateFrom` and `dateTo` from config to `createCategoryRules`

2. **Update Holiday Specials Script**
   - Apply same fix to `scripts/create-holiday-specials-pricelist.ts`
   - Ensure date ranges are set on pricelist items

3. **Update Elite Yearly Event Script**
   - Apply same fix to `scripts/create-elite-yearly-event-pricelist.ts`
   - Ensure date ranges are set correctly

4. **Test Date Validation**
   - Run scripts for current season (Winter)
   - Verify only Winter Promotions show
   - Verify other seasonal promotions are hidden

#### Files to Modify
- `scripts/create-seasonal-promotions-pricelist.ts`
- `scripts/create-holiday-specials-pricelist.ts`
- `scripts/create-elite-yearly-event-pricelist.ts`

#### Expected Outcome
- Only active seasonal promotions show based on current date
- Date ranges properly validated at pricelist item level
- No inactive seasonal deals displayed

---

### Phase 2: Fix Deal Card Styling (High Priority)

#### Problem
Deals may not be showing proper card styling with discount percentage, original scratched price, and deal price. Need to verify `dealInfo` is being passed correctly.

#### Investigation Steps
1. **Check API Response**
   - Verify `savings` and `savingsPercent` are calculated correctly for all deal types
   - Check category-based percentage discounts are being calculated
   - Verify `dealActive` flag is set correctly

2. **Check Frontend Integration**
   - Verify `dealInfo` prop is passed to `DrinkCard` for all deals
   - Check if `isDealsPage` prop is set correctly
   - Verify `dealInfo` structure matches `DrinkCard` expectations

3. **Check Edge Cases**
   - Products with 0% discount (should still show deal styling)
   - Products with very small discounts
   - Products with large discounts (FOMO badge)

#### Solution
1. **Ensure API Returns Complete Deal Info**
   - Verify `savings` and `savingsPercent` are always calculated
   - Ensure `dealActive` is set based on server-side validation
   - Add logging to track missing deal info

2. **Fix Frontend Integration**
   - Ensure all deals pass `dealInfo` to `DrinkCard`
   - Verify `isDealsPage={true}` is set
   - Add fallback for missing `dealInfo`

3. **Test All Deal Types**
   - Test Monday Morning Deals
   - Test Happy Hour Deals
   - Test Seasonal Promotions (after Phase 1 fix)
   - Test Holiday Specials
   - Test Flash Sales
   - Test General Deals

#### Files to Check/Modify
- `src/app/api/deals/route.ts` - Verify deal info calculation
- `src/app/deals/page.tsx` - Verify `dealInfo` prop passing
- `src/components/DrinkCard.tsx` - Verify deal styling logic

#### Expected Outcome
- All deals show proper card styling
- Original price shown with strikethrough
- Deal price prominently displayed
- Savings percentage shown correctly
- FOMO badges appear for 20%+ discounts

---

### Phase 3: Run Seasonal/Holiday Scripts (High Priority)

#### Tasks
1. **Run Seasonal Promotions Script (After Phase 1 Fix)**
   ```bash
   npx tsx scripts/create-seasonal-promotions-pricelist.ts
   ```
   - Verify only Winter Promotions are active
   - Check date ranges are set correctly

2. **Run Holiday Specials Script**
   ```bash
   npx tsx scripts/create-holiday-specials-pricelist.ts
   ```
   - Configure for upcoming holidays
   - Verify date ranges are set correctly

3. **Run Elite Yearly Event Script**
   ```bash
   npx tsx scripts/create-elite-yearly-event-pricelist.ts
   ```
   - Verify it's set for June 1st annually
   - Check date ranges are correct

4. **Verify Automation**
   - Check GitHub Actions workflows are running
   - Verify new product launch automation is working
   - Test product rotation scripts

#### Expected Outcome
- Current seasonal promotions active
- Upcoming holidays configured
- Automation verified working
- All scripts executed successfully

---

### Phase 4: Enhanced Deal Discovery API (Medium Priority)

#### Requirements
Create `/api/v1/deals/discovery` endpoint with enhanced schema including:
- `deal_price` (rounded)
- `original_value`
- `savings_percentage`
- `selection_logic` (choice sets for combos)
- `gamification` fields
- `is_available` (inventory-aware - skip for now)
- `ends_in_seconds` (countdown timer)

#### Implementation
1. **Create New API Route**
   - File: `src/app/api/v1/deals/discovery/route.ts`
   - Reuse logic from `/api/deals` but with enhanced schema
   - Add gamification fields (badge eligibility, streak eligibility)
   - Add countdown timer calculation

2. **Enhanced Schema**
   ```typescript
   interface DealDiscovery {
     deal_id: string;
     slug: string;
     display_name: string;
     pricing: {
       deal_price: number; // Rounded
       original_value: number;
       savings_percentage: number;
       savings_amount: number;
     };
     selection_logic?: {
       choice_sets: Array<{
         name: string;
         required: boolean;
         options: Array<{
           id: string;
           name: string;
           extra: number;
           available: boolean;
         }>;
       }>;
     };
     gamification?: {
       badge_id?: string;
       streak_eligible: boolean;
     };
     is_available: boolean;
     ends_in_seconds?: number;
   }
   ```

3. **Add Countdown Timer Logic**
   - Calculate time remaining for time-sensitive deals
   - Return `ends_in_seconds` for active deals with time windows

4. **Add Gamification Fields**
   - Check if deal is eligible for badges
   - Check if deal is eligible for streaks
   - Return badge IDs if applicable

#### Files to Create/Modify
- `src/app/api/v1/deals/discovery/route.ts` (new)
- `src/types/deals.ts` - Add `DealDiscovery` type

#### Expected Outcome
- New API endpoint with enhanced schema
- Gamification fields included
- Countdown timers for time-sensitive deals
- Better structure for future mobile apps

---

### Phase 5: Odoo 19 Native Combo Integration (Medium Priority)

#### Current State
- Combo detection only works for "Weekend Specials"
- Uses pricelist rules to detect combos
- No native Odoo combo product support

#### Requirements
- Use Odoo 19 `product.template` (type: `combo`) for native combo support
- Map Odoo combo choice sets to frontend UI
- Better combo detection in API

#### Investigation Steps
1. **Research Odoo 19 Combo Structure**
   - Check if `product.template` has `type: 'combo'` field
   - Understand choice sets structure
   - Check how combos are stored in Odoo

2. **Update Odoo Client**
   - Add method to fetch combo products
   - Add method to fetch combo choice sets
   - Add method to get combo pricing

3. **Update API Route**
   - Detect combo products from Odoo
   - Map choice sets to frontend format
   - Calculate combo pricing correctly

4. **Update Frontend**
   - Support choice sets in `ComboDealCard`
   - Allow users to select options from choice sets
   - Display combo pricing correctly

#### Files to Modify
- `src/server/utils/odooClient.ts` - Add combo fetching methods
- `src/app/api/deals/route.ts` - Update combo detection
- `src/components/ComboDealCard.tsx` - Support choice sets

#### Expected Outcome
- Native Odoo combo products supported
- Choice sets displayed in frontend
- Better combo management
- Improved combo pricing calculation

---

## 🎯 Implementation Priority

### High Priority (Fix Bugs)
1. ✅ **Phase 1:** Fix Seasonal Promotions Date Validation
2. ✅ **Phase 2:** Fix Deal Card Styling
3. ✅ **Phase 3:** Run Seasonal/Holiday Scripts

### Medium Priority (Enhancements)
4. ⚠️ **Phase 4:** Enhanced Deal Discovery API
5. ⚠️ **Phase 5:** Odoo 19 Native Combo Integration

---

## 📊 Testing Checklist

### Phase 1 Testing
- [ ] Run seasonal promotions script
- [ ] Verify only Winter Promotions show (current season)
- [ ] Verify Summer, Spring, Fall are hidden
- [ ] Check date ranges in Odoo
- [ ] Test date validation logic

### Phase 2 Testing
- [ ] Verify all deals show proper card styling
- [ ] Check original price with strikethrough
- [ ] Check deal price prominently displayed
- [ ] Verify savings percentage shown
- [ ] Test FOMO badges (20%+ discounts)
- [ ] Test all deal types

### Phase 3 Testing
- [ ] Verify seasonal promotions are active
- [ ] Check holiday specials are configured
- [ ] Verify Elite Yearly Event is set
- [ ] Test automation workflows
- [ ] Check product rotation

### Phase 4 Testing
- [ ] Test new API endpoint
- [ ] Verify enhanced schema
- [ ] Check gamification fields
- [ ] Verify countdown timers
- [ ] Test with different deal types

### Phase 5 Testing
- [ ] Verify combo products detected
- [ ] Check choice sets displayed
- [ ] Test combo pricing
- [ ] Verify combo selection works

---

## 🔧 Technical Details

### Date Range Format
- Odoo expects dates in format: `YYYY-MM-DD`
- Timezone: Africa/Cairo (handled by server-side validation)
- Date comparison: Server-side only (no client-side manipulation)

### Deal Info Structure
```typescript
interface DealInfo {
  originalPrice: number;
  dealPrice: number;
  dealActive: boolean;
  savings: number;
  savingsPercent: number;
}
```

### Combo Detection Logic
- Currently: Detects combos from pricelist rules (Weekend Specials only)
- Future: Detect from Odoo native combo products
- Choice sets: Array of required/optional product selections

---

## 📝 Notes

- **Date Validation:** All date validation must be server-side
- **Price Calculation:** All prices must come from Odoo
- **Security:** Validate all inputs, sanitize outputs
- **Performance:** Cache where possible, optimize queries
- **Error Handling:** Graceful degradation, clear error messages

---

## 🚀 Next Steps

1. **Start with Phase 1** (Fix Seasonal Promotions)
2. **Then Phase 2** (Fix Deal Card Styling)
3. **Then Phase 3** (Run Scripts)
4. **Then Phase 4** (Enhanced API)
5. **Finally Phase 5** (Native Combo Integration)

---

## 📚 Related Documents

- `docs/DEALS_COMPREHENSIVE_STRATEGY.md` - Full strategy
- `docs/DEALS_REMAINING_WORK.md` - Remaining work summary
- `docs/DEALS_IMPLEMENTATION_STATUS.md` - Implementation status

