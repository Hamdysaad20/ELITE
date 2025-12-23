# Deals Page Phase 1 - Detailed Implementation Plan

## 🎯 Phase 1 Goals

1. Fix duplicate products
2. Improve price display on cards
3. Redesign combo cards
4. Hide inactive deals
5. Add user activation CTA

---

## 📋 Task Breakdown

### Task 1: Fix Duplicate Products (Backend)

**File**: `src/app/api/deals/route.ts`

**Current Issue**: Products can appear in multiple deals, causing duplicates

**Solution**: Deduplicate products after processing all pricelists

**Implementation Steps**:

1. **After processing all pricelists** (around line 550), add deduplication:

```typescript
// After building all deals array
const seenProductIds = new Set<string>();
const seenComboIds = new Set<string>();

const deduplicatedDeals = deals.map(deal => {
  // Deduplicate regular products
  const uniqueProducts = deal.products.filter(product => {
    if (seenProductIds.has(product.id)) {
      console.log(`[DEALS API] Skipping duplicate product: ${product.id} (${product.name})`);
      return false;
    }
    seenProductIds.add(product.id);
    return true;
  });

  // Deduplicate combos
  const uniqueCombos = deal.combos?.filter(combo => {
    if (seenComboIds.has(combo.id)) {
      console.log(`[DEALS API] Skipping duplicate combo: ${combo.id}`);
      return false;
    }
    seenComboIds.add(combo.id);
    return true;
  });

  return {
    ...deal,
    products: uniqueProducts,
    combos: uniqueCombos,
  };
});

// Also ensure products in combos are not shown as individual products
const productIdsInCombos = new Set<string>();
deduplicatedDeals.forEach(deal => {
  deal.combos?.forEach(combo => {
    combo.items.forEach(item => {
      productIdsInCombos.add(item.id);
    });
  });
});

// Remove products that are part of combos from individual products list
const finalDeals = deduplicatedDeals.map(deal => ({
  ...deal,
  products: deal.products.filter(product => !productIdsInCombos.has(product.id)),
}));
```

2. **Return deduplicated deals** instead of original deals array

3. **Test**:
   - Create multiple pricelists with same products
   - Verify each product appears only once
   - Verify combo items don't appear as individual products

---

### Task 2: Improve Price Display on Cards

**File**: `src/components/DrinkCard.tsx`

**Current Issue**: Only deal price shown, no original price comparison

**Solution**: Enhance price display section when `isDealsPage={true}`

**Implementation Steps**:

1. **Update price display section** (around line 200-250):

```typescript
// In the price display section
{isDealsPage && dealInfo ? (
  <div className="mt-2 space-y-1">
    {/* Original Price (strikethrough) */}
    {dealInfo.originalPrice > dealInfo.dealPrice && (
      <p className="text-xs font-cabin text-elite-black/50 line-through">
        {dealInfo.originalPrice.toFixed(0)} EGP
      </p>
    )}
    
    {/* Deal Price (prominent) */}
    <div className="flex items-center gap-2 flex-wrap">
      <p className="font-cabin text-elite-burgundy font-bold text-lg sm:text-xl">
        {dealInfo.dealPrice.toFixed(0)} EGP
      </p>
      
      {/* Savings Badge */}
      {dealInfo.savings > 0 && (
        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-cabin font-semibold">
          Save {dealInfo.savingsPercent > 0 
            ? `${dealInfo.savingsPercent.toFixed(0)}%` 
            : `${dealInfo.savings.toFixed(0)} EGP`}
        </span>
      )}
    </div>
    
    {/* Deal Status Message */}
    {!dealInfo.dealActive && (
      <p className="text-xs font-cabin text-amber-600 mt-1">
        Deal not currently active
      </p>
    )}
  </div>
) : (
  // Regular price display (existing code)
  <p className="font-cabin text-elite-burgundy font-bold text-lg sm:text-xl">
    {price?.toFixed(0) || 0} EGP
  </p>
)}
```

2. **Ensure proper spacing and alignment**

3. **Test**:
   - Verify original price shows (strikethrough)
   - Verify deal price shows (bold, burgundy)
   - Verify savings badge shows
   - Verify layout on mobile and desktop

---

### Task 3: Redesign Combo Cards

**File**: `src/components/ComboDealCard.tsx`

**Current Issues**:
- Items shown as simple list
- No individual prices
- No "You Saved" calculation
- Individual ordering buttons visible

**Solution**: Complete redesign with embedded items, prices, and savings

**Implementation Steps**:

1. **Update component structure**:

```typescript
// Replace items list section (around line 186-196) with:
<div className="mb-4 space-y-2 bg-elite-cream/30 rounded-xl p-3">
  <p className="text-xs font-cabin font-semibold text-elite-black/70 mb-2">
    Items included:
  </p>
  {combo.items.map((item, idx) => (
    <div key={item.id} className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-elite-burgundy font-semibold">•</span>
        <span className="font-cabin text-elite-black/80 truncate">
          {item.name}
        </span>
      </div>
      <span className="font-cabin text-elite-black/60 text-xs ml-2 flex-shrink-0">
        {item.price.toFixed(0)} EGP
      </span>
    </div>
  ))}
</div>
```

2. **Update price section** (around line 198-226):

```typescript
{/* Price Section */}
<div className="mt-auto space-y-2 bg-white/50 rounded-xl p-4 border border-elite-burgundy/10">
  {/* Original Total */}
  <div className="flex items-center justify-between">
    <span className="font-cabin text-elite-black/70 text-sm">
      Original Total:
    </span>
    <span className="font-cabin text-elite-black/50 text-sm line-through">
      {combo.originalTotal.toFixed(0)} EGP
    </span>
  </div>
  
  {/* Deal Price */}
  <div className="flex items-center justify-between">
    <span className="font-cabin text-elite-black/70 text-sm font-semibold">
      Combo Price:
    </span>
    <span className="font-cabin text-elite-burgundy font-bold text-lg">
      {combo.dealPrice.toFixed(0)} EGP
    </span>
  </div>
  
  {/* Divider */}
  <div className="h-px bg-elite-burgundy/20 my-2" />
  
  {/* Savings (Prominent) */}
  {combo.dealActive && combo.savings > 0 && (
    <div className="flex items-center justify-between">
      <span className="font-cabin text-emerald-700 font-bold text-base">
        You Save:
      </span>
      <div className="flex items-center gap-2">
        <span className="font-cabin text-emerald-700 font-bold text-base">
          {combo.savings.toFixed(0)} EGP
        </span>
        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-cabin font-semibold">
          ({combo.savingsPercent.toFixed(0)}% off)
        </span>
      </div>
    </div>
  )}
</div>
```

3. **Ensure no individual ordering buttons** (already correct, verify)

4. **Update `src/app/deals/page.tsx`**:
   - Remove separate rendering of combo items
   - Ensure combo items are only shown inside `ComboDealCard`

5. **Test**:
   - Verify items embedded in combo card
   - Verify individual prices shown
   - Verify savings calculation correct
   - Verify only combo button (no individual buttons)
   - Verify responsive design

---

### Task 4: Hide Inactive Deals

**File**: `src/app/deals/page.tsx`

**Current Issue**: Inactive deals are shown

**Solution**: Filter to only show active deals

**Implementation Steps**:

1. **Filter deals** (around line 163):

```typescript
// Filter to only show active deals
const activeDeals = deals.filter(deal => deal.active && (
  deal.products.length > 0 || (deal.combos && deal.combos.length > 0)
));

// Update isEmpty check
const isEmpty = !loading && !error && activeDeals.length === 0;
```

2. **Update rendering** to use `activeDeals` instead of `deals`

3. **Update empty state** (around line 152):

```typescript
{!loading && !error && isEmpty && (
  <EmptyState
    variant="no-products"
    title="No Active Deals"
    description="There are no active deals at the moment. Check back soon for new offers!"
    actionLabel="Refresh"
    onAction={handleRetry}
  />
)}
```

4. **Test**:
   - Verify inactive deals hidden
   - Verify empty state shows when no active deals
   - Verify active deals still show

---

### Task 5: Add User Activation CTA

**Files**:
- Create: `src/components/deals/UserActivationCTA.tsx`
- Modify: `src/app/deals/page.tsx`

**Implementation Steps**:

1. **Create CTA component**:

```typescript
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserActivationCTAProps {
  className?: string;
}

export default function UserActivationCTA({ className }: UserActivationCTAProps) {
  const { data: session } = useSession();
  const router = useRouter();

  // Check if user is logged in
  if (!session?.user) {
    return null; // Don't show for non-logged-in users (or show different CTA)
  }

  // Check profile completeness (simplified - expand later)
  const isProfileComplete = 
    session.user.email &&
    session.user.emailVerified &&
    session.user.phone; // Add more checks as needed

  if (isProfileComplete) {
    return null; // Don't show if profile is complete
  }

  const handleClick = () => {
    router.push(`/profile?redirect=/deals`);
  };

  return (
    <div className={cn(
      "bg-gradient-to-r from-elite-burgundy to-elite-burgundy/90 rounded-2xl p-6 md:p-8 text-elite-cream",
      "shadow-lg border border-elite-burgundy/20",
      className
    )}>
      <div className="flex items-start gap-4">
        <div className="bg-elite-cream/20 rounded-xl p-3 flex-shrink-0">
          <Sparkles className="w-6 h-6 text-elite-cream" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-calistoga text-xl md:text-2xl mb-2">
            🎁 Unlock Exclusive Deals
          </h3>
          <p className="font-cabin text-elite-cream/90 mb-4 text-sm md:text-base">
            Complete your profile to get personalized deals, early access to new offers, and special discounts.
          </p>
          
          <ul className="space-y-2 mb-4 text-sm md:text-base">
            <li className="flex items-center gap-2 font-cabin text-elite-cream/90">
              <span className="text-emerald-300">✓</span>
              Personalized deals based on your preferences
            </li>
            <li className="flex items-center gap-2 font-cabin text-elite-cream/90">
              <span className="text-emerald-300">✓</span>
              Early access to new offers
            </li>
            <li className="flex items-center gap-2 font-cabin text-elite-cream/90">
              <span className="text-emerald-300">✓</span>
              Special discounts and promotions
            </li>
          </ul>
          
          <button
            onClick={handleClick}
            className="w-full sm:w-auto bg-elite-cream text-elite-burgundy px-6 py-3 rounded-xl font-cabin font-bold text-sm md:text-base hover:bg-elite-cream/90 transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <User className="w-4 h-4" />
            Complete Profile
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

2. **Integrate into deals page** (around line 260, after info box):

```typescript
{/* User Activation CTA */}
{!loading && !error && activeDeals.length > 0 && (
  <div className="mt-8 md:mt-12">
    <UserActivationCTA />
  </div>
)}
```

3. **Test**:
   - Verify CTA shows for incomplete profiles
   - Verify CTA hidden for complete profiles
   - Verify CTA hidden for non-logged-in users (or show different CTA)
   - Verify button navigates to profile page

---

## 🧪 Testing Checklist

### Backend Tests
- [ ] No duplicate products in API response
- [ ] Combo items not shown as individual products
- [ ] Active deals only returned when `includeInactive=false`
- [ ] Price calculations correct

### Frontend Tests
- [ ] Price display shows original + deal price
- [ ] Savings badge shows correct percentage/amount
- [ ] Combo cards show individual prices
- [ ] Combo cards show savings calculation
- [ ] No individual ordering buttons for combo items
- [ ] Inactive deals hidden
- [ ] User activation CTA shows for incomplete profiles
- [ ] User activation CTA hidden for complete profiles
- [ ] Mobile responsive
- [ ] Desktop layout correct

### Integration Tests
- [ ] End-to-end flow: deals page → add to cart → checkout
- [ ] Combo deals add all items to cart correctly
- [ ] Price validation at checkout

---

## 📝 Implementation Order

1. **Task 1**: Fix duplicates (backend) - **30 min**
2. **Task 2**: Improve price display - **45 min**
3. **Task 3**: Redesign combo cards - **2 hours**
4. **Task 4**: Hide inactive deals - **15 min**
5. **Task 5**: Add user activation CTA - **1 hour**

**Total Estimated Time**: ~4.5 hours

---

## ✅ Definition of Done

- [ ] All tasks completed
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Deployed to staging
- [ ] Tested on staging
- [ ] Deployed to production
- [ ] Monitored for errors

---

## 🚀 Next Steps After Phase 1

1. Gather user feedback
2. Monitor analytics
3. Plan Phase 2 (Odoo combo integration)
4. Plan Phase 3 (Design polish)
5. Plan Phase 4 (Advanced features)

