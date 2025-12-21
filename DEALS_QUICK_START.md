# Monday Morning Deals - Quick Start Guide

## 🚀 Quick Setup (3 Steps)

### Step 1: Create Pricelist in Odoo
```bash
npx tsx scripts/create-monday-deals-pricelist.ts
```

### Step 2: Validate Setup
```bash
npx tsx scripts/validate-deals-setup.ts
```

### Step 3: Test the Page
Visit: `http://localhost:3000/deals`

## 📋 What Gets Created

### In Odoo:
- **Pricelist**: "Monday Morning Deals"
- **Pricelist Items**: 6 products with fixed prices
  - 40 EGP: Iced Latte, Hot Latte, Iced Cappuccino, Hot Cappuccino
  - 25 EGP: Espresso, Turkish Coffee

### In Next.js:
- **API**: `/api/deals` - Returns products with deal prices
- **Page**: `/deals` - Displays deal products
- **Hook**: `useDeals()` - React hook for fetching deals

## ✅ Expected Behavior

### When Deal is Active (Monday 8:00 AM - 1:00 PM):
- ✅ Products show deal prices
- ✅ Add-to-cart enabled
- ✅ Green banner: "Deals Are Active Now!"
- ✅ Price comparison shown (original vs deal)

### When Deal is Inactive:
- ⏰ Products show original prices
- ⏰ Deal prices shown as "Deal: X EGP"
- ⏰ Yellow banner: "Deals Coming Soon"
- ⚠️ Add-to-cart may be disabled

## 🔍 Verification Checklist

- [ ] Pricelist exists in Odoo
- [ ] All 6 products found and configured
- [ ] API endpoint returns products: `curl http://localhost:3000/api/deals?includeInactive=true`
- [ ] Page loads without errors
- [ ] Products display correctly
- [ ] Time validation works (test on Monday 8 AM - 1 PM)

## 🐛 Common Issues

### "Pricelist not found"
→ Run setup script: `npx tsx scripts/create-monday-deals-pricelist.ts`

### "No products showing"
→ Check products exist in Odoo with exact names
→ Verify products have `sale_ok = true`
→ Run validation script to see what's missing

### "Prices not matching"
→ Verify pricelist items have correct `fixed_price`
→ Check pricelist is active in Odoo
→ Ensure product IDs match

## 📚 Full Documentation

See `docs/DEALS_IMPLEMENTATION.md` for complete details.

## 🎯 Key Files

- **Setup**: `scripts/create-monday-deals-pricelist.ts`
- **Validation**: `scripts/validate-deals-setup.ts`
- **API**: `src/app/api/deals/route.ts`
- **Page**: `src/app/deals/page.tsx`
- **Hook**: `src/hooks/useDeals.ts`
- **Time Utils**: `src/lib/deals/timeValidation.ts`

---

**Ready to go!** 🎉

