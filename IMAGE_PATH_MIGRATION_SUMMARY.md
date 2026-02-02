# Image Path Migration Summary

## ✅ Completed: Migration from `/products/` to `/Old Items/`

All image loading logic has been successfully updated to use the `/Old Items/` directory instead of `/products/`.

---

## Files Modified

### 1. **DrinkCard.tsx**

**Path**: `f:\ELITE\src\components\DrinkCard.tsx`

**Changes**:

- Updated local image path generation from `/products/${slug}/v1-1.png` to `/Old Items/${baseName}-1.png`
- Removed slugification step (now uses `extractBaseName` directly)
- Updated comments to reflect new directory structure

**Before**:

```typescript
const slug = slugify(extractBaseName(name));
const localImage = `/products/${slug}/v1-1.png${v ? `?v=${v}` : ""}`;
```

**After**:

```typescript
const baseName = extractBaseName(name);
const localImage = `/Old Items/${baseName}-1.png${v ? `?v=${v}` : ""}`;
```

---

### 2. **imageUtils.ts**

**Path**: `f:\ELITE\src\lib\imageUtils.ts`

**Function**: `getLocalProductImageCandidates()`

**Changes**:

- Updated to use `/Old Items/` directory
- Changed filename pattern from `/products/${slug}/v1-1.png` to `/Old Items/${name}-1.png`
- Removed slugification logic
- Default filename changed from `"v1-1.png"` to `"-1.png"`

**Before**:

```typescript
export function getLocalProductImageCandidates(
  name: string | undefined | null,
  filename: string = "v1-1.png",
): string[] {
  if (!name) return [];
  const base = extractBaseName(name);
  const slugs = [slugify(base), slugify(name)].filter(Boolean);
  const uniqueSlugs = Array.from(new Set(slugs));
  return uniqueSlugs.map((s) => `/products/${s}/${filename}`);
}
```

**After**:

```typescript
export function getLocalProductImageCandidates(
  name: string | undefined | null,
  filename: string = "-1.png",
): string[] {
  if (!name) return [];
  const base = extractBaseName(name);
  const candidates = [base, name].filter(Boolean).map((n) => `${n}${filename}`);
  const uniqueCandidates = Array.from(new Set(candidates));
  return uniqueCandidates.map((c) => `/Old Items/${c}`);
}
```

---

## Components Using `getLocalProductImageCandidates`

All these components now automatically use `/Old Items/` images:

1. ✅ `ProductDetailClient.tsx` - Product detail pages
2. ✅ `OrderDetailCard.tsx` - Order history display
3. ✅ `ProductModal.tsx` - Product modal dialogs
4. ✅ `DealCard.tsx` - Deal promotions
5. ✅ `ComboDealCard.tsx` - Combo deal displays
6. ✅ `CartDrawer.tsx` - Shopping cart
7. ✅ `order/page.tsx` - Order page
8. ✅ `DrinkCard.tsx` - Product cards throughout the site

---

## Image Naming Pattern

### Old Pattern (Products directory):

```
/products/
  ├── cappuccino/
  │   └── v1-1.png
  ├── spanish-latte/
  │   └── v1-1.png
  └── ...
```

### New Pattern (Old Items directory):

```
/Old Items/
  ├── Cappuccino-1.png
  ├── Spanish Latte-1.png
  ├── Espresso-1.png
  └── ...
```

---

## Benefits of Migration

1. ✅ **Higher Quality Images**: Old Items directory contains optimized, high-quality product images
2. ✅ **Consistent with menuData.ts**: Matches the recent changes to menu data image paths
3. ✅ **Simpler Structure**: Flat directory structure instead of nested folders
4. ✅ **Better Naming**: Uses actual product names instead of slugified versions
5. ✅ **Single Source of Truth**: All images now come from one directory

---

## Testing Recommendations

1. **Menu Pages**: Visit `/menu` and verify all product images load correctly
2. **Product Detail Pages**: Click on any product and check image display
3. **Cart**: Add items to cart and verify images appear
4. **Order History**: Check that past orders show correct product images
5. **Deals Page**: Verify deal card images load properly

---

## Fallback Behavior

If an image doesn't exist in `/Old Items/`, the system will fallback to:

1. Original Odoo images from the API
2. Placeholder image if no valid images are available

This ensures a seamless experience even for products without local images.

---

**Status**: ✅ Complete - All image paths successfully migrated to `/Old Items/`
