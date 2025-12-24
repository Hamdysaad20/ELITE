# Deal Product Selection Guide

## Overview

The deals system supports **intelligent product selection** across all categories. When creating a deal (e.g., "Winter Promotion"), you can include the **best and most suitable items** from any category - Food, Coffee, Iced Drinks, Frappe, etc.

## How Product Selection Works

### Current Architecture

The system uses **Odoo pricelists** to define deals. Each pricelist can have three types of rules:

1. **Product-Specific Rules**: Apply to individual products (regardless of category)
2. **Category-Based Rules**: Apply to all products in a category
3. **Global Rules**: Apply to all products

### For Cross-Category Deals (e.g., "Winter Promotion")

To create a deal that includes products from multiple categories:

#### Option 1: Product-Specific Rules (Recommended for Curated Selections)

Create pricelist items for each product you want to include:

```typescript
// Example: Winter Promotion with selected items
const winterProducts = [
  { productId: 123, name: "Hot Chocolate", category: "Drinks" },
  { productId: 456, name: "Apple Pie", category: "Food" },
  { productId: 789, name: "Caramel Frappé", category: "Frappe" },
  { productId: 101, name: "Iced Latte", category: "Iced" },
];

// Create pricelist items for each
for (const product of winterProducts) {
  await createPricelistItem({
    pricelist_id: winterPricelistId,
    product_id: product.productId,
    compute_price: "percentage",
    percent_price: -20, // 20% discount
  });
}
```

**Benefits:**
- ✅ Full control over which products are included
- ✅ Can select the "best" items from each category
- ✅ Mix and match products based on business logic
- ✅ Perfect for seasonal/event promotions

#### Option 2: Multiple Category Rules

Create category-based rules for multiple categories:

```typescript
// Example: Winter Promotion for multiple categories
const winterCategories = ["Coffee", "Food", "Frappe", "Iced"];

for (const categoryName of winterCategories) {
  await createPricelistItem({
    pricelist_id: winterPricelistId,
    categ_id: categoryId, // Get category ID from Odoo
    compute_price: "percentage",
    percent_price: -20, // 20% discount
  });
}
```

**Benefits:**
- ✅ Applies to all products in selected categories
- ✅ Easier to manage for category-wide promotions
- ✅ Automatic inclusion of new products in those categories

#### Option 3: Hybrid Approach (Best of Both)

Combine product-specific rules for curated items with category rules for broader coverage:

```typescript
// Curated best-sellers (product-specific)
const bestSellers = [123, 456, 789];
for (const productId of bestSellers) {
  await createPricelistItem({
    pricelist_id: winterPricelistId,
    product_id: productId,
    compute_price: "percentage",
    percent_price: -25, // Higher discount for best-sellers
  });
}

// Category-wide coverage
const categories = ["Coffee", "Food"];
for (const categoryName of categories) {
  await createPricelistItem({
    pricelist_id: winterPricelistId,
    categ_id: categoryId,
    compute_price: "percentage",
    percent_price: -15, // Standard discount
  });
}
```

## Example: Creating a "Winter Promotion" Deal

### Step 1: Identify Suitable Products

Select products that fit the winter theme:
- **Hot Beverages**: Hot Chocolate, Cappuccino, Latte
- **Comfort Food**: Apple Pie, Croissant, Sandwich
- **Seasonal Items**: Any winter-themed specials

### Step 2: Create Pricelist in Odoo

```typescript
// Script: create-winter-promotion-pricelist.ts
const pricelist = await client.create("product.pricelist", {
  name: "Winter Promotions",
  active: true,
  // ... other config
});

// Add selected products
const selectedProducts = [
  // Hot beverages
  { id: 101, name: "Hot Chocolate" },
  { id: 102, name: "Cappuccino" },
  { id: 103, name: "Latte" },
  
  // Food items
  { id: 201, name: "Apple Pie" },
  { id: 202, name: "Croissant" },
  
  // Seasonal items
  { id: 301, name: "Caramel Frappé" },
  { id: 302, name: "Iced Latte" },
];

for (const product of selectedProducts) {
  await client.create("product.pricelist.item", {
    pricelist_id: pricelist.id,
    product_id: product.id,
    compute_price: "percentage",
    percent_price: -20, // 20% discount
  });
}
```

### Step 3: Verify on Website

The deal will automatically appear on `/deals` with:
- All selected products from different categories
- Proper discount applied
- Visual separation with background container

## Best Practices

### 1. **Curate, Don't Just Include Everything**

For seasonal/event promotions, select products that:
- Fit the theme (e.g., winter = hot beverages, comfort food)
- Are popular/best-sellers
- Have good margins
- Create a cohesive experience

### 2. **Use Product-Specific Rules for Premium Deals**

When you want to highlight specific items:
- Use product-specific rules
- Can apply different discounts to different products
- More control over the deal composition

### 3. **Use Category Rules for Broad Promotions**

When you want category-wide coverage:
- Use category-based rules
- Easier to manage
- Automatic inclusion of new products

### 4. **Mix Both Approaches**

For complex promotions:
- Use product-specific for curated highlights
- Use category rules for broader coverage
- Different discount levels for different tiers

## API Behavior

The `/api/deals` endpoint:
1. ✅ Fetches all pricelists from Odoo
2. ✅ Processes product-specific, category-based, and global rules
3. ✅ Filters products based on allowed/excluded categories
4. ✅ Applies discounts and validates business rules
5. ✅ Returns deals with products from **any category** (as long as they're in allowed categories)

## Visual Display

Each deal section on `/deals`:
- ✅ Has a light creamy background (`bg-white/50 rounded-2xl`)
- ✅ Visually separated from other deals
- ✅ Shows products from multiple categories together
- ✅ Displays item count and deal status

## Summary

**The system already supports cross-category product selection!** 

When creating deals in Odoo:
- Use **product-specific rules** to curate the best items from different categories
- The API will automatically include them in the deal
- Products will display together in a visually separated section

This gives you full flexibility to create deals like "Winter Promotion" that include:
- Coffee items
- Food items  
- Iced drinks
- Frappes
- Any combination you want!

