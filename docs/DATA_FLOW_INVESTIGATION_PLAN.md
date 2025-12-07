# Data Flow Investigation & Production Readiness Plan

**Date:** December 6, 2025  
**Status:** 📋 Investigation & Planning Phase  
**Goal:** Make frontend 100% dynamic, pulling all data from Odoo with no static fallbacks

---

## 🔍 Current State Analysis

### **Data Flow Architecture**

```
Odoo 19 Database
    ↓
[/api/sync/products] - POST endpoint (syncs data to Redis)
    ↓
Redis Cache (Upstash)
    ├── categories:list
    ├── products:all
    ├── products:{id}
    └── sync:last_update
    ↓
[/api/categories] - GET endpoint
[/api/products] - GET endpoint
    ↓
useCategories() hook
useProducts() hook
    ↓
Menu Pages (with FALLBACK logic)
    ↓
DrinkCard Components
```

### **Last Sync Status**
✅ **Last Update:** 2025-12-06T15:42:50.649Z (Today)  
✅ **Queue Status:** 0 waiting, 0 active, 0 failed  
✅ **Data Available:** 245 products, 14 categories

---

## 🚨 **CRITICAL ISSUES IDENTIFIED**

### **Issue #1: Static Fallback Logic** ⚠️
**Location:** `/src/app/menu/page.tsx` (Lines 52-58)

```typescript
const USE_FALLBACK = error?.includes("503") || error?.includes("cache is empty");

if (USE_FALLBACK) {
  return getAllCategories(); // ← Returns STATIC data from menuData.ts
}
```

**Problem:**
- When cache is empty or error occurs, falls back to `/src/lib/menuData.ts`
- `menuData.ts` contains **538 lines** of hardcoded menu data
- Changes in Odoo won't reflect if fallback is active
- Not production-ready (defeats purpose of Odoo integration)

**Files Affected:**
- `/src/app/menu/page.tsx`
- `/src/app/menu/[category]/page.tsx`
- `/src/app/menu/[category]/[subcategory]/[item]/page.tsx`
- `/src/lib/menuData.ts` (ENTIRE FILE is static data)

---

### **Issue #2: Incomplete Data Syncing** ⚠️
**Location:** `/src/app/api/sync/products/route.ts`

**Currently Syncing:**
```typescript
const fields = [
  "id",
  "name",
  "default_code",
  "list_price",
  "categ_id",
  "active",
  "sale_ok",
  "image_128",
  "image_1024", 
  "image_1920",
  "uom_id",
  "taxes_id",
  "product_tmpl_id",
];
```

**Missing Important Fields:**
- ❌ `description` / `description_sale` - Product descriptions
- ❌ `attribute_line_ids` - Product variants (sizes, flavors)
- ❌ `product_variant_ids` - Variant data
- ❌ `qty_available` - Stock levels
- ❌ `type` - Product type (consumable, service, etc.)
- ❌ `website_published` - Visibility control
- ❌ `sequence` - Display order
- ❌ Custom fields if any

**Impact:**
- Products show as "Unnamed Product" if name missing
- No descriptions (all showing null)
- No variant support (sizes, flavors, toppings)
- No stock awareness

---

### **Issue #3: Category Data Incomplete** ⚠️
**Location:** `/src/app/api/sync/products/route.ts` (Line 157)

```typescript
const categoriesRaw = await client.searchRead<CategoryRecord>(
  "product.category",
  [],
  ["id", "name", "parent_id"], // ← Only 3 fields
);
```

**Missing Fields:**
- ❌ `description` - Category descriptions
- ❌ `parent_path` - Full hierarchy
- ❌ `sequence` - Display order
- ❌ `image_128` / `image_1920` - Category images
- ❌ `product_count` - Number of products
- ❌ Custom fields if any

**Impact:**
- Categories show generic "Explore our selection" description
- No category images
- No custom ordering
- Can't show product counts

---

### **Issue #4: Image Handling Issues** ⚠️

**Current Logic:**
```typescript
const image1024 = (rec.image_1024 && typeof rec.image_1024 === 'string') 
  ? rec.image_1024 
  : (template?.image_1024 && typeof template.image_1024 === 'string') 
    ? template.image_1024 
    : null;
```

**Problems:**
- Falls back to template images (good!)
- BUT: Returns `[]` if no image found
- Products showing: `"imageCount": 0` for ALL products
- ImageWithFallback component kicks in (shows placeholder)

**Questions to Investigate:**
1. Do products actually have images in Odoo?
2. Are images base64 encoded in Odoo fields?
3. Is the image field name correct (`image_1024` vs `image_medium`)?
4. Should we use Odoo's image URL instead of base64?

---

### **Issue #5: Data Mapping Inconsistency** ⚠️

**API Returns:**
```json
{
  "id": "609",
  "title": "Americano",      // ← "title"
  "description": null,
  "price": 70,
  "available": true,
  "images": []
}
```

**DrinkCard Expects:**
```typescript
interface DrinkCardProps {
  id?: string;
  images?: string[];
  name?: string;              // ← "name"
  price?: number;
  description?: string;
  available?: boolean;
}
```

**Current Workaround:**
```typescript
// In menu/page.tsx (Line 83)
name: p.title || "Unnamed Product",  // ← Manual mapping
```

**Problem:**
- Inconsistent naming convention (title vs name)
- Requires mapping in every component
- Prone to errors
- Not type-safe

---

## 📋 **DETAILED ACTION PLAN**

### **Phase 1: Remove Static Fallbacks** 🔴 CRITICAL

#### **Task 1.1: Eliminate menuData.ts Dependency**
**Files to Modify:**
- `/src/app/menu/page.tsx`
- `/src/app/menu/[category]/page.tsx`
- `/src/app/menu/[category]/[subcategory]/[item]/page.tsx`

**Actions:**
```typescript
// REMOVE:
const USE_FALLBACK = error?.includes("503") || error?.includes("cache is empty");
if (USE_FALLBACK) {
  return getAllCategories();
}

// REPLACE WITH:
// Show ErrorState component with clear message
// Force user to sync data from Odoo
```

**Rationale:**
- Forces proper error handling
- Ensures Odoo is single source of truth
- Makes cache issues visible immediately

---

#### **Task 1.2: Archive Static Menu Data**
**Files to Modify:**
- `/src/lib/menuData.ts` → Rename to `/src/lib/menuData.DEPRECATED.ts`
- Add deprecation notice

**Actions:**
- Keep file for reference only
- Add clear deprecation warnings
- Update all imports to remove dependency

---

### **Phase 2: Enhance Odoo Data Sync** 🟡 HIGH PRIORITY

#### **Task 2.1: Expand Product Fields**
**File:** `/src/app/api/sync/products/route.ts`

**Add to `fields` array:**
```typescript
const fields = [
  // Existing fields
  "id",
  "name",
  "default_code",
  "list_price",
  "categ_id",
  "active",
  "sale_ok",
  
  // Image fields
  "image_128",
  "image_256",
  "image_512",
  "image_1024",
  "image_1920",
  
  // Description fields
  "description",
  "description_sale",
  "description_purchase",
  
  // Variant fields
  "attribute_line_ids",
  "product_variant_ids",
  "product_variant_count",
  
  // Stock & availability
  "qty_available",
  "virtual_available",
  "type",
  
  // Web & display
  "website_published",
  "sequence",
  "priority",
  
  // Pricing
  "standard_price",
  "currency_id",
  
  // Units & taxes
  "uom_id",
  "uom_po_id",
  "taxes_id",
  "supplier_taxes_id",
  
  // Template reference
  "product_tmpl_id",
  
  // Metadata
  "create_date",
  "write_date",
];
```

**Test:**
```bash
curl -X POST http://localhost:3000/api/sync/products \
  -H "x-admin-token: YOUR_TOKEN"

# Verify fields are synced
curl http://localhost:3000/api/products?pageSize=1 | jq '.data.items[0]'
```

---

#### **Task 2.2: Expand Category Fields**
**File:** `/src/app/api/sync/products/route.ts`

**Enhance category sync:**
```typescript
const categoriesRaw = await client.searchRead<CategoryRecord>(
  "product.category",
  [],
  [
    "id",
    "name",
    "parent_id",
    "parent_path",
    "sequence",
    "description",       // NEW
    "image_128",         // NEW
    "image_1920",        // NEW
    "product_count",     // NEW (if available)
    "create_date",       // NEW
    "write_date",        // NEW
  ]
);
```

---

#### **Task 2.3: Fetch Product Variants**
**File:** `/src/app/api/sync/products/route.ts`

**Add variant fetching:**
```typescript
// After fetching products, fetch variants
if (hasVariants) {
  const variantFields = [
    "id",
    "product_tmpl_id",
    "attribute_value_ids",
    "price_extra",
    "image_variant_1920",
  ];
  
  const variantsRaw = await client.searchRead(
    "product.product",
    [["product_tmpl_id", "in", templateIdsWithVariants]],
    variantFields
  );
  
  // Map variants to products
  // Store in Redis: variants:{templateId}
}
```

---

### **Phase 3: Standardize Data Models** 🟡 HIGH PRIORITY

#### **Task 3.1: Create Unified Product Type**
**File:** `/src/types/product.ts` (NEW)

```typescript
/**
 * Standardized Product from Odoo
 * Single source of truth for product structure
 */
export interface Product {
  id: string;
  name: string;              // Renamed from "title"
  sku: string;
  description?: string | null;
  price: number;
  categoryId?: string;
  available: boolean;
  images: string[];
  
  // Stock
  stockLevel?: number;
  isInStock?: boolean;
  
  // Variants
  variants?: ProductVariant[];
  hasVariants: boolean;
  
  // Display
  sequence?: number;
  featured?: boolean;
  websitePublished?: boolean;
  
  // Metadata
  uom?: { id: number; name: string };
  taxes?: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  priceExtra: number;
  attributes: {
    name: string;
    value: string;
  }[];
  images?: string[];
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string;
  parentPath?: string;
  sequence?: number;
  image?: string;
  productCount?: number;
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
}
```

---

#### **Task 3.2: Update normalizeProduct Function**
**File:** `/src/app/api/sync/products/route.ts`

```typescript
function normalizeProduct(
  rec: ProductRecord,
  templateImages?: Map<number, ProductTemplateRecord>
): Product {  // ← Use new Product type
  return {
    id: String(rec.id),
    name: rec.name,  // ← Consistent naming (not "title")
    sku: rec.default_code || String(rec.id),
    description: rec.description_sale || rec.description || null,
    price: rec.list_price ?? 0,
    categoryId: extractCategoryId(rec.categ_id),
    available: rec.active !== false && rec.sale_ok !== false,
    images: extractImages(rec, templateImages.get(templateId)),
    
    // NEW FIELDS
    stockLevel: rec.qty_available,
    isInStock: (rec.qty_available || 0) > 0,
    hasVariants: (rec.product_variant_count || 0) > 1,
    sequence: rec.sequence,
    featured: false, // Derive from Odoo field if available
    websitePublished: rec.website_published !== false,
    
    uom: extractUom(rec.uom_id),
    taxes: Array.isArray(rec.taxes_id) ? rec.taxes_id : [],
    
    createdAt: rec.create_date,
    updatedAt: rec.write_date,
  };
}
```

---

### **Phase 4: Fix Image Handling** 🟡 HIGH PRIORITY

#### **Task 4.1: Investigate Odoo Image Storage**

**Questions to Answer:**
1. Are images stored as base64 in Odoo fields?
2. Should we use Odoo's image URL instead?
3. What's the correct field name pattern?

**Test Query (in Odoo):**
```python
# In Odoo shell/notebook
products = env['product.product'].search([('sale_ok', '=', True)], limit=5)
for p in products:
    print(f"ID: {p.id}, Name: {p.name}")
    print(f"  image_1920: {type(p.image_1920)} - {len(p.image_1920) if p.image_1920 else 0} bytes")
    print(f"  image_1024: {type(p.image_1024)} - {len(p.image_1024) if p.image_1024 else 0} bytes")
    print(f"  Has template image: {bool(p.product_tmpl_id.image_1920)}")
```

---

#### **Task 4.2: Implement Multiple Image Sources**
**File:** `/src/app/api/sync/products/route.ts`

```typescript
function extractImages(
  product: ProductRecord,
  template?: ProductTemplateRecord
): string[] {
  const images: string[] = [];
  
  // Priority order: 1920 > 1024 > 512 > 256 > 128
  const imageSizes = ['image_1920', 'image_1024', 'image_512', 'image_256', 'image_128'];
  
  for (const size of imageSizes) {
    // Check product first
    const productImage = product[size];
    if (productImage && typeof productImage === 'string' && productImage.length > 100) {
      images.push(`data:image/png;base64,${productImage}`);
      break; // Use highest quality available
    }
    
    // Fallback to template
    const templateImage = template?.[size];
    if (templateImage && typeof templateImage === 'string' && templateImage.length > 100) {
      images.push(`data:image/png;base64,${templateImage}`);
      break;
    }
  }
  
  return images;
}
```

**Alternative:** Use Odoo image URLs
```typescript
// If Odoo exposes image URLs
const imageUrl = `${process.env.ODOO_URL}/web/image/product.product/${product.id}/image_1920`;
images.push(imageUrl);
```

---

### **Phase 5: Frontend Cleanup** 🟢 MEDIUM PRIORITY

#### **Task 5.1: Remove Fallback Logic from Menu Pages**
**Files:**
- `/src/app/menu/page.tsx`
- `/src/app/menu/[category]/page.tsx`

**Changes:**
```typescript
// REMOVE all USE_FALLBACK logic
// REMOVE getAllCategories() imports
// REMOVE menuData imports

// REPLACE error handling:
if (error) {
  return (
    <ErrorState
      error={error}
      onRetry={() => {
        refetchCategories();
        refetchProducts();
      }}
      customMessage="Unable to load menu. Please sync data from Odoo."
      actionLabel="Sync from Odoo"
      actionHref="/api/sync/products" // Or admin panel
    />
  );
}

if (categoriesEmpty) {
  return (
    <EmptyState
      variant="no-data"
      title="No menu data available"
      description="The menu hasn't been synced from Odoo yet."
      actionLabel="Sync Menu Data"
      actionHref="/admin/sync" // Link to sync page
    />
  );
}
```

---

#### **Task 5.2: Update Component Props**
**Files:**
- `/src/components/DrinkCard.tsx`
- All other product components

**Ensure consistent naming:**
```typescript
// Use "name" everywhere (not "title")
interface DrinkCardProps {
  product: Product;  // Pass entire product object
  // OR individual props with consistent naming
}
```

---

### **Phase 6: Add Sync Management UI** 🟢 LOW PRIORITY

#### **Task 6.1: Create Admin Sync Page**
**File:** `/src/app/admin/sync/page.tsx` (NEW)

**Features:**
- Button to trigger `/api/sync/products`
- Display last sync time
- Show sync status (in progress, success, failed)
- Display product/category counts
- Option to force re-sync
- View sync logs

---

#### **Task 6.2: Auto-Sync on Odoo Webhook**
**File:** `/src/app/api/webhooks/odoo/route.ts` (NEW)

**Setup:**
- Odoo webhook triggers on product/category changes
- Webhook validates signature
- Triggers selective sync for changed items
- Updates Redis cache

---

## 🧪 **Testing Plan**

### **Test 1: Fresh Cache**
```bash
# Clear Redis cache
redis-cli FLUSHALL

# Verify empty state
curl http://localhost:3000/api/products
# Should return 503 with "cache is empty"

# Frontend should show EmptyState (not fallback data)
# Visit /menu → Should see "No menu data available"
```

### **Test 2: Sync from Odoo**
```bash
# Trigger sync
curl -X POST http://localhost:3000/api/sync/products \
  -H "x-admin-token: YOUR_TOKEN"

# Verify sync
curl http://localhost:3000/api/sync/status | jq '.'

# Check categories
curl http://localhost:3000/api/categories | jq '.data.categories | length'

# Check products
curl http://localhost:3000/api/products?pageSize=5 | jq '.data.items[]'
```

### **Test 3: Frontend Display**
```bash
# Visit /menu
# All products should display with data from Odoo
# No fallback to menuData.ts

# Add new product in Odoo
# Sync again
# Verify new product appears on website
```

### **Test 4: Category Management**
```bash
# Create new category in Odoo
# Sync
# Verify category appears on /menu

# Update category description in Odoo
# Sync
# Verify description updates on website
```

---

## 📊 **Success Criteria**

### **Phase 1 Complete:**
- ✅ No references to `menuData.ts` in menu pages
- ✅ All menu data comes from Odoo via API
- ✅ Empty cache shows proper EmptyState (not fallback)
- ✅ Errors show ErrorState with retry option

### **Phase 2 Complete:**
- ✅ Product sync includes all necessary fields
- ✅ Categories sync with descriptions and images
- ✅ Variants/attributes properly synced
- ✅ Stock levels tracked

### **Phase 3 Complete:**
- ✅ Unified Product and Category types
- ✅ Consistent naming (name, not title)
- ✅ Type-safe data flow

### **Phase 4 Complete:**
- ✅ Products with images display correctly
- ✅ Products without images show placeholder
- ✅ Multiple image sizes supported
- ✅ Image quality appropriate for display

### **Phase 5 Complete:**
- ✅ All fallback logic removed
- ✅ Components use standardized props
- ✅ Error handling production-ready

### **Phase 6 Complete:**
- ✅ Admin can trigger sync from UI
- ✅ Sync status visible
- ✅ Webhook auto-sync (optional)

---

## 🚀 **Implementation Order**

### **Day 1 (CRITICAL):**
1. Investigate image fields in Odoo (Task 4.1)
2. Expand product sync fields (Task 2.1)
3. Test sync with expanded fields
4. Verify data in Redis

### **Day 2 (HIGH):**
5. Create unified Product type (Task 3.1)
6. Update normalizeProduct (Task 3.2)
7. Fix image extraction (Task 4.2)
8. Expand category sync (Task 2.2)

### **Day 3 (MEDIUM):**
9. Remove fallback logic (Task 5.1)
10. Archive menuData.ts (Task 1.2)
11. Update component props (Task 5.2)
12. Test end-to-end flow

### **Day 4 (POLISH):**
13. Create admin sync page (Task 6.1)
14. Add webhook support (Task 6.2)
15. Final testing
16. Documentation

---

## 📝 **Files Requiring Changes**

### **Critical Changes:**
1. `/src/app/api/sync/products/route.ts` - Expand fields, fix normalization
2. `/src/app/menu/page.tsx` - Remove fallback logic
3. `/src/app/menu/[category]/page.tsx` - Remove fallback logic
4. `/src/types/product.ts` - NEW file with unified types

### **Medium Priority:**
5. `/src/lib/menuData.ts` - Rename to .DEPRECATED.ts
6. `/src/components/DrinkCard.tsx` - Update to use standardized props
7. `/src/hooks/useProducts.ts` - Update type references
8. `/src/hooks/useCategories.ts` - Update type references

### **Low Priority:**
9. `/src/app/admin/sync/page.tsx` - NEW admin page
10. `/src/app/api/webhooks/odoo/route.ts` - NEW webhook handler

---

## ✅ **Verification Checklist**

Before marking complete, verify:

- [ ] Redis cache can be empty without app crashing
- [ ] EmptyState shows when no data (not fallback)
- [ ] ErrorState shows on API errors (not fallback)
- [ ] All product fields sync from Odoo
- [ ] All category fields sync from Odoo
- [ ] Images display correctly (or placeholder)
- [ ] New Odoo product appears after sync
- [ ] New Odoo category appears after sync
- [ ] Updated Odoo data reflects after sync
- [ ] No hardcoded menu data anywhere
- [ ] All types are consistent (Product, Category)
- [ ] No "title" vs "name" confusion
- [ ] Admin can trigger sync from UI
- [ ] Sync status is visible to admin

---

## 🎯 **End Goal**

**Production-Ready Dynamic Menu System:**
- ✅ 100% data from Odoo
- ✅ No static fallbacks
- ✅ Real-time sync capability
- ✅ Proper error handling
- ✅ Admin management UI
- ✅ Type-safe throughout
- ✅ Scalable architecture

**User Can:**
- Add product in Odoo → Appears on website after sync
- Update product → Changes reflect after sync
- Add category → New category displays
- Upload image → Image shows on website
- Set stock → Stock levels update

**Developer Can:**
- Trust all data comes from Odoo
- Add new fields easily
- Extend product attributes
- Debug issues clearly
- Scale to thousands of products

---

## 📌 **Notes & Considerations**

### **Performance:**
- Consider pagination for 1000+ products
- Cache TTL strategy (currently indefinite)
- Incremental sync vs full sync

### **Error Handling:**
- What if Odoo is down during sync?
- How to handle partial sync failures?
- Retry strategy for failed syncs

### **Data Integrity:**
- Validate data before storing in Redis
- Handle missing required fields
- Sanitize user input from Odoo

### **Security:**
- Protect sync endpoint (x-admin-token)
- Validate webhook signatures
- Rate limiting on sync endpoint

---

**Ready to begin implementation?** Start with Day 1 tasks!
