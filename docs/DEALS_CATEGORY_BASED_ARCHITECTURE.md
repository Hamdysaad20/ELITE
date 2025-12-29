# Category-Based Deals Architecture

## Overview

The deals system has been redesigned to support **category-based deals** as a first-class business concept, while maintaining backward compatibility with Odoo pricelists.

## Database Schema

### Deal Model

Represents a business deal (e.g., "Monday Morning Deals", "Happy Hour Deals").

```prisma
model Deal {
  id            String   @id @default(uuid())
  name          String
  description   String?
  slug          String   @unique
  
  // Odoo Integration
  odooPricelistId Int?    @unique
  odooPricelistName String?
  
  // Deal Configuration
  discountType  String   // 'percentage' | 'fixed'
  discountValue Decimal
  maxDiscount   Decimal?
  
  // Time-based Validity
  startDate     DateTime?
  endDate       DateTime?
  timeWindow    Json?    // { days: [0,1,2], startTime: "08:00", endTime: "13:00" }
  
  // Status
  isActive      Boolean  @default(true)
  priority      Int      @default(0) // Higher priority deals override lower ones
  
  categories    DealCategory[]
}
```

### DealCategory Model

Junction table linking deals to categories (many-to-many relationship).

```prisma
model DealCategory {
  id          String   @id @default(uuid())
  dealId     String
  deal       Deal     @relation(...)
  categoryId String
  category   Category @relation(...)
}
```

## Architecture Benefits

### 1. **Business Logic Clarity**

Instead of managing individual products, deals are now defined at the **category level**:
- "Monday Morning Deals" → Applies to "Coffee" and "Food" categories
- "Happy Hour Deals" → Applies to "Drinks" category
- "Weekend Specials" → Applies to "Food" and "Beverages" categories

### 2. **Automatic Product Inclusion**

When a deal is assigned to a category, **all products in that category** automatically become eligible for the deal (subject to business rules like max discount, exclusions, etc.).

### 3. **Scalability**

- Adding new products to a category automatically includes them in relevant deals
- No need to manually update pricelist items for each new product
- Easier to manage seasonal promotions and category-wide discounts

### 4. **Priority System**

Deals have a `priority` field to handle overlapping deals:
- Higher priority deals override lower priority ones
- Useful for special events (e.g., "Elite Yearly University Event" has higher priority than "General Deals")

## Implementation Strategy

### Phase 1: Database Schema ✅

- [x] Created `Deal` model
- [x] Created `DealCategory` junction table
- [x] Added relations to `Category` model
- [x] Created migration

### Phase 2: API Integration (Next)

The API will:
1. **Check database first**: Look for `Deal` records with matching categories
2. **Fallback to Odoo**: If no database deals found, use existing Odoo pricelist logic
3. **Merge results**: Combine database deals with Odoo pricelist deals

### Phase 3: Admin Interface (Future)

- Create/edit deals through admin panel
- Assign categories to deals
- Set time windows, discount values, priorities
- Sync with Odoo pricelists (bidirectional)

## Migration Path

### Current State (Odoo-Only)

- Deals are defined in Odoo as pricelists
- API reads pricelists and applies discounts
- No database representation

### Target State (Hybrid)

- Deals can be defined in database (category-based)
- Deals can still be defined in Odoo (for backward compatibility)
- API merges both sources
- Admin can manage deals in database or Odoo

### Future State (Database-First)

- All deals managed in database
- Odoo pricelists synced from database
- Single source of truth: database
- Odoo becomes a "sync target" rather than source

## Example Usage

### Creating a Category-Based Deal

```typescript
// Create a deal
const deal = await prisma.deal.create({
  data: {
    name: "Monday Morning Deals",
    slug: "monday-morning-deals",
    description: "Special prices on coffee and breakfast items",
    discountType: "percentage",
    discountValue: 20, // 20% off
    maxDiscount: 40, // Cap at 40%
    timeWindow: {
      days: [1], // Monday
      startTime: "08:00",
      endTime: "13:00"
    },
    isActive: true,
    priority: 10,
    categories: {
      create: [
        { categoryId: "coffee-category-id" },
        { categoryId: "food-category-id" }
      ]
    }
  }
});
```

### Querying Deals by Category

```typescript
// Get all active deals for a category
const deals = await prisma.deal.findMany({
  where: {
    isActive: true,
    categories: {
      some: {
        categoryId: "coffee-category-id"
      }
    }
  },
  include: {
    categories: {
      include: {
        category: true
      }
    }
  }
});
```

## Benefits for Business

1. **Easier Management**: Assign deals to categories instead of individual products
2. **Automatic Updates**: New products in a category automatically get deal pricing
3. **Better Organization**: Deals are organized by business logic (categories) rather than technical implementation (pricelists)
4. **Flexibility**: Can still use Odoo pricelists for product-specific deals
5. **Scalability**: Easy to add new deals without touching individual products

## Next Steps

1. ✅ Database schema created
2. ✅ Migration file created
3. ⏳ Update API to use new schema (while maintaining Odoo compatibility)
4. ⏳ Create service layer for deal management
5. ⏳ Build admin interface for deal management
6. ⏳ Sync mechanism between database and Odoo

