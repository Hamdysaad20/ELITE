# Elite Coffee - Phase 2 Enhancement Plan

## Status: ✅ PHASE 2.1 & 2.2 COMPLETE

**Execution Date:** December 7, 2025  
**Total Products:** 93 active (archived Cup POS item)

---

## ✅ Completed Fixes

### Phase 2.1: Fixed Product Attributes ✅

| Product | Removed Attributes |
|---------|-------------------|
| Turkish Coffee Single | milk, espresso shots, foam, flavor |
| Turkish Coffee Double | milk, espresso shots, foam, flavor |
| Morning Bird Offer "Turkish/Espresso" D | milk, espresso shots, foam, flavor |
| Morning Bird Offer "Turkish/Espresso" S | milk, espresso shots, foam, flavor |
| All Smoothies (6) | milk |
| Water | size |
| Cup | ALL attrs (then archived) |
| Iced Lemon | milk, espresso shots, flavor |
| Golden Peach Sunrise | milk, espresso shots, flavor |
| Raspberry & Pineapple | milk, espresso shots, flavor |
| ice Flavours | milk, espresso shots |
| BOBA Chocolate | espresso shots |
| Brown Sugar BOBA | espresso shots |
| [Taro] Boba/Bubble | espresso shots |
| Black Cat | espresso shots |
| Iced Chai Latte | espresso shots |
| Iced Chocolate | espresso shots |
| Icee Chocolate | espresso shots |
| Bestie Offer BOBA | espresso shots |

**Script:** `scripts/phase2_fix_attributes.ts`

### Phase 2.2: Recategorized Products ✅

| Product | From | To |
|---------|------|-----|
| Coffee Frappé | Coffee | Frappe |
| Mocha Frappé | Coffee | Frappe |
| Matcha Latte (Iced) | Coffee | Iced |
| Spanish Latte (Iced) | Coffee | Iced |
| Cup | Refreshers | Archived |

**Script:** `scripts/phase2_recategorize.ts`

### Final Category Distribution:
- Coffee: 20 products
- Iced: 22 products
- Frappe: 5 products
- Milkshake: 8 products
- Smoothie: 6 products
- Tea: 9 products
- Refreshers: 7 products
- Food: 10 products
- Services: 6 products

---

## 🔴 Critical Issues Found

### 1. Wrong Attributes on Products

| Product | Category | Wrong Attributes | Should Have |
|---------|----------|-----------------|-------------|
| Turkish Coffee Single | Coffee | milk, espresso shots, foam, flavor | size, sugar level, cup |
| Turkish Coffee Double | Coffee | milk, espresso shots, foam, flavor | size, sugar level, cup |
| Morning Bird Offer "Turkish/Espresso" D | Coffee | milk, espresso shots, foam, flavor | size, sugar level |
| Morning Bird Offer "Turkish/Espresso" S | Coffee | milk, espresso shots, foam, flavor | size, sugar level |
| Custom Smoothie | Smoothie | milk | size, extras |
| Mango Smoothie | Smoothie | milk | size, extras |
| Mixed Berry Smoothie | Smoothie | milk | size, extras |
| Passion Fruit Smoothie | Smoothie | milk | size, extras |
| Raspberry & Pineapple Smoothie | Smoothie | milk | size, extras |
| Strawberry Smoothie | Smoothie | milk | size, extras |
| Water | Refreshers | size | (none needed) |
| Cup | Refreshers | ALL attrs | (none needed - this is POS item) |

### 2. Products That Shouldn't Have Espresso Shots

These non-coffee drinks incorrectly have "espresso shots" attribute:
- BOBA Chocolate
- BOBA Spanish latte (this one might need it)
- Golden Peach Sunrise
- Iced Chai Latte
- Iced Chocolate
- Iced Lemon
- Raspberry & Pineapple
- ice Flavours
- Black Cat
- Brown Sugar BOBA/Bubble [Classic]
- [Taro] Boba/Bubble

### 3. Products That Shouldn't Have Milk Selection

Non-dairy base drinks with milk attribute:
- All Smoothies (fruit-based, not milk-based)
- Iced Lemon
- Golden Peach Sunrise
- Raspberry & Pineapple

### 4. Miscategorized or Unclear Products

| Product | Current Category | Issue |
|---------|-----------------|-------|
| Coffee Frappé | Coffee | Should be in Frappe |
| Mocha Frappé | Coffee | Should be in Frappe |
| Matcha Latte (Iced) | Coffee | Should be in Iced or Tea |
| Spanish Latte (Iced) | Coffee | Should be in Iced |
| KINDER STEAK Single | Tea | Name unclear - is this food? |
| Cup | Refreshers | POS item, not a drink |

### 5. POS/Service Items Mixed with Products

These should be hidden from menu or in separate category:
- Cup
- Water (maybe keep?)
- Deposit
- Down Payment (POS)
- Gift Card
- Settle Due
- Settle Invoice
- Top-up eWallet

---

## 🟡 Enhancement Todos

### Phase 2.1: Fix Product Attributes (P0 - Critical)

- [ ] **Turkish Coffee** - Remove: milk, espresso shots, foam, flavor. Keep: size, sugar level, cup
- [ ] **Smoothies** - Remove: milk. Keep: size, extras
- [ ] **Water** - Remove all attributes
- [ ] **Cup** - Remove all attributes (POS item)
- [ ] **Boba drinks** - Remove espresso shots (except Spanish Latte Boba)
- [ ] **Iced Lemon** - Remove: milk, espresso shots, flavor. Keep: size, sugar level, ice level
- [ ] **Golden Peach Sunrise** - Remove: milk, espresso shots. Keep: size, ice level
- [ ] **Raspberry & Pineapple** - Remove: milk, espresso shots. Keep: size, ice level

### Phase 2.2: Recategorize Products (P1)

- [ ] Move Coffee Frappé → Frappe
- [ ] Move Mocha Frappé → Frappe
- [ ] Move Matcha Latte (Iced) → Iced
- [ ] Move Spanish Latte (Iced) → Iced
- [ ] Move KINDER STEAK Single → Verify what this is
- [ ] Move Cup → Services or archive

### Phase 2.3: Product Attribute Rules by Type (P1)

Create proper attribute mappings:

| Product Type | Required Attributes | Optional Attributes |
|--------------|--------------------|--------------------|
| Espresso-based Coffee | size, espresso shots, milk, sugar level | flavor, foam |
| Turkish Coffee | size, sugar level, cup | - |
| Tea (plain) | size, sugar level | tea taste, type |
| Chai/Matcha Latte | size, milk, sugar level | flavor |
| Frappe | size, milk, espresso shots, whipped cream, drizzle | flavor |
| Milkshake | size, milk, whipped cream | flavor, thickness |
| Smoothie | size | extras |
| Boba | size, sugar level, ice level, milk | flavor, extras |
| Soda/Refresher | size | flavor |
| Water | - | - |

### Phase 2.4: Category Cleanup (P2)

Current categories are good but some parent relationships might exist:
- Coffee (13)
- Tea (14)
- Iced (18)
- Frappe (19)
- Milkshake (20)
- Smoothie (21)
- Refreshers (23)
- Food (26)
- Services (25)

Consider archiving unused:
- Crushes & Purees (17) - if unused
- Sauces (16) - if unused
- Sides (22) - if unused
- Toppings (15) - if unused
- Expenses (24) - if unused

### Phase 2.5: Product Name Cleanup (P2)

- [ ] "KINDER STEAK Single" → Clarify/rename
- [ ] " Espresso Avocado" → "Espresso Avocado" (remove leading space)
- [ ] "Espresso Double " → "Double Espresso" (remove trailing space)
- [ ] "HUNY CAKE " → "Honey Cake" (fix typo, remove trailing space)
- [ ] "ice Flavours" → Clarify what this is
- [ ] Remove emojis from "✨ Bestie Offer ✨" products or keep consistently

---

## 📋 Execution Scripts Needed

| Script | Purpose | Priority |
|--------|---------|----------|
| `fix_turkish_coffee_attrs.ts` | Remove wrong attrs from Turkish Coffee | P0 |
| `fix_smoothie_attrs.ts` | Remove milk from Smoothies | P0 |
| `fix_boba_attrs.ts` | Remove espresso shots from non-coffee boba | P0 |
| `fix_refresher_attrs.ts` | Clean up Water, Soda attrs | P0 |
| `recategorize_frappes.ts` | Move Frappes to correct category | P1 |
| `cleanup_product_names.ts` | Fix typos and spacing | P2 |
| `archive_unused_categories.ts` | Archive empty categories | P2 |

---

## ✅ Quick Wins (Can Do Now)

1. Fix Turkish Coffee attributes
2. Fix Smoothie attributes (remove milk)
3. Remove all attributes from Water and Cup
4. Move Coffee Frappé and Mocha Frappé to Frappe category

---

*Created: December 7, 2025*
