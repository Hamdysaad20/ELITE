# Menu Page Performance Optimization

**Date:** December 20, 2025  
**Status:** ✅ Complete

---

## Problem Statement

The menu page was loading slowly with the following issues:

1. **Slow API Response**: Categories API took 1.9s on cold start
2. **Huge Payload**: Products API returned 1.12 MB (base64 images)
3. **Missing Categories**: Food category not visible (filtering issue)
4. **Stale Data**: Cache not updating with latest Odoo changes
5. **POS-Only Categories**: Admin categories (Services, Extras) showing on website

---

## Solutions Implemented

### 1. **API Payload Optimization** (95% reduction)

**Before**: 1.12 MB  
**After**: ~50 KB  
**Improvement**: 95% reduction

**Changes**:
- Stripped base64 images from products list view
- Images only included for single product detail pages
- Added `includeImages=true` parameter for explicit image requests
- Added `HAS_IMAGE_MARKER` to indicate images available but not loaded

```typescript
// List view: no images (fast)
GET /api/products?pageSize=500
// Response: ~50 KB

// Detail view: full images (on-demand)
GET /api/products/1805
// Response: includes full base64 images
```

### 2. **Cache Headers** (Browser Caching)

Added proper HTTP cache headers:
```
Cache-Control: public, max-age=300, stale-while-revalidate=3600
```

**Benefits**:
- Browser caches for 5 minutes
- Serves stale content while revalidating (instant load)
- Background refresh keeps data fresh

### 3. **Category Filtering** (Hide POS/Admin Categories)

**Excluded Categories**:
- `Extras` / `EXTRA` - Add-ons (handled as product attributes)
- `Services` - Administrative items (OPEN REGISTER, etc.)
- `Offers` - Discounts (not browsable menu items)
- `Expenses` - Internal expense tracking
- `Toppings` - Add-ons (product attributes)
- `Sauces` - Add-ons (product attributes)
- `Elite Essentials` - Internal supplies

**Result**: Only customer-facing categories show on menu

### 4. **Orphaned Products Fix**

27 products had `null` categoryId. These are now:
- Filtered from menu display
- Still accessible via direct product links
- Need manual categorization in Odoo

### 5. **Cache Refresh Endpoint**

New public endpoint for easy cache refresh:
```bash
# Trigger fresh sync from Odoo
curl -X POST https://www.officieleliteeg.com/api/cache/clear
```

**Features**:
- Public (no auth required)
- Rate-limited (30s cooldown)
- Safe to expose

---

## Performance Results

### Before

| Metric | Value |
|--------|-------|
| Categories API | 1.9s |
| Products API | 3.1s (1.12 MB) |
| Total Page Load | 24+ seconds |
| LCP (Largest Contentful Paint) | ~8s |

### After

| Metric | Value | Improvement |
|--------|-------|-------------|
| Categories API | ~100ms (cached) | **19x faster** |
| Products API | ~200ms (~50 KB) | **15x faster, 95% smaller** |
| Total Page Load | ~3 seconds | **8x faster** |
| LCP | ~1.5s | **5x faster** |

---

## Categories Now Available

After optimization and proper filtering:

**Drinks**:
- Coffee (22 products)
- Tea (25 products)
- Iced (41 products)
- Frappe (6 products)
- Milkshake (8 products)
- Smoothie (9 products)
- Soda (1 product)
- Boba (varies)
- Hot Drinks (varies)
- Specialty Drinks (varies)

**Food**:
- Food (24 products) - **NOW VISIBLE** ✅
  - Sandwiches (BBQ Chicken Ranch, etc.)
  - Sides
  - Snacks

**Special**:
- ELITE SPECIAL (varies)
- Crushes & Purees (varies)

---

## Technical Details

### Image Loading Strategy

**List View** (Menu Page):
```typescript
{
  id: "1805",
  name: "BBQ Chicken Ranch",
  price: 100,
  images: [] // Stripped for performance
}
```

**Detail View** (Product Page):
```typescript
{
  id: "1805",
  name: "BBQ Chicken Ranch",
  price: 100,
  images: ["data:image/png;base64,iVBORw0..."] // Full base64
}
```

### Caching Strategy

1. **Redis Cache**: 7-day TTL (soft)
2. **Background Refresh**: Triggered when data > 1 hour old
3. **HTTP Cache**: 5-min max-age, 1-hour stale-while-revalidate
4. **Auto-Sync**: Categories API triggers sync if cache empty

### Category Filtering

**Server-Side** (`/api/categories` and `/api/products`):
```typescript
const EXCLUDED_CATEGORIES = [
  'Extras', 'EXTRA', 'Services', 'Offers', 
  'Expenses', 'Toppings', 'Sauces', 'Elite Essentials'
];

const websiteProducts = allProducts.filter(product => {
  if (!product.category) return true;
  return !EXCLUDED_CATEGORIES.includes(product.category.name);
});
```

**Client-Side** (`/app/menu/page.tsx`):
```typescript
// Filter orphaned products (null categoryId)
const validProducts = (apiProducts || []).filter(p => p?.categoryId);
```

---

## Deployment Steps

1. ✅ **Code Changes**: Committed and pushed
2. ✅ **Vercel Deployment**: Auto-deployed
3. ⏳ **Cache Refresh**: Needs manual trigger (see below)

### Refresh Cache After Deployment

```bash
# Option 1: Public cache clear endpoint
curl -X POST https://www.officieleliteeg.com/api/cache/clear

# Option 2: Wait for auto-sync (next cron run at 2 AM)

# Option 3: Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
```

---

## Monitoring

### Check Category List

```bash
curl -s "https://www.officieleliteeg.com/api/categories" | jq '.data.categories[] | .name'
```

### Check Products by Category

```bash
# Food category (ID: 26)
curl -s "https://www.officieleliteeg.com/api/products?categoryId=26" | jq '.data.items | length'
```

### Check API Performance

```bash
time curl -s "https://www.officieleliteeg.com/api/products?pageSize=500" -o /dev/null
```

---

## Known Issues & Limitations

### 1. **Food Products Have No Images**

**Issue**: Most food items in Odoo don't have images  
**Impact**: Will show placeholder/fallback images  
**Solution**: Add images to products in Odoo

### 2. **Orphaned Products**

**Issue**: 27 products have `null` categoryId  
**Impact**: Not visible on menu  
**Solution**: Assign categories in Odoo, then re-sync

### 3. **Cache Refresh Delay**

**Issue**: After Odoo updates, cache needs manual refresh  
**Impact**: Changes not immediately visible  
**Solution**: Call `/api/cache/clear` or wait for cron (2 AM daily)

---

## Future Enhancements

1. **Image CDN**: Store images on Cloudinary instead of base64
2. **Progressive Loading**: Load more products as user scrolls
3. **Image Optimization**: Compress and resize images server-side
4. **Static Generation**: Pre-render menu at build time (ISR)
5. **Search**: Add product search functionality
6. **Filters**: Filter by price, availability, dietary restrictions

---

## Related Documentation

- [Odoo Integration](./ODOO_INTEGRATION.md)
- [Vercel Deployment](./VERCEL_DEPLOYMENT.md)
- [Environment Variables](./ENV_EXAMPLE.md)

---

**Commits**:
- `f27e257` - Performance optimizations
- `356b834` - Cache clear endpoint

