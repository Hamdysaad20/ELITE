# Odoo 19 API Schema Documentation

**Date:** December 6, 2025  
**Purpose:** Document Odoo 19 API schema, field types, and available data for products and categories

---

## Table of Contents

1. [Product Model (product.product)](#product-model)
2. [Product Template Model (product.template)](#product-template-model)
3. [Product Category Model (product.category)](#product-category-model)
4. [Image Fields](#image-fields)
5. [Field Types Reference](#field-types-reference)
6. [API Methods](#api-methods)
7. [Current Implementation](#current-implementation)
8. [Recommendations](#recommendations)

---

## Product Model (product.product)

**Model Name:** `product.product`  
**Description:** Product variants - each product.template can have multiple product.product records (variants)

### Core Fields

| Field Name | Type | Description | Example Value |
|------------|------|-------------|---------------|
| `id` | Integer | Unique product ID | 609 |
| `name` | Char | Product name | "Americano" |
| `default_code` | Char | Internal reference/SKU | "EE001" |
| `list_price` | Float | Public price | 70.0 |
| `standard_price` | Float | Cost price | 50.0 |
| `categ_id` | Many2one | Category reference | [13, "Hot Drinks / Coffee"] |

### Stock/Inventory Fields

| Field Name | Type | Description | Available in v19? |
|------------|------|-------------|-------------------|
| `qty_available` | Float | Quantity on hand | ✅ Yes |
| `virtual_available` | Float | Forecasted quantity | ✅ Yes |
| `incoming_qty` | Float | Incoming quantity | ✅ Yes |
| `outgoing_qty` | Float | Outgoing quantity | ✅ Yes |
| `free_qty` | Float | Free to use quantity | ✅ Yes |

### Description Fields

| Field Name | Type | Description | Available in v19? |
|------------|------|-------------|-------------------|
| `description` | Text | Internal notes | ✅ Yes (often null) |
| `description_sale` | Text | Sales description | ✅ Yes (often null) |
| `description_purchase` | Text | Purchase description | ✅ Yes |

### Image Fields (Binary)

| Field Name | Type | Size | Description |
|------------|------|------|-------------|
| `image_1920` | Binary | 1920x1920 | Full size image (base64) |
| `image_1024` | Binary | 1024x1024 | Large image |
| `image_512` | Binary | 512x512 | Medium image |
| `image_256` | Binary | 256x256 | Small image |
| `image_128` | Binary | 128x128 | Thumbnail |

**Note:** Images are stored as base64-encoded strings. All images are **currently empty** in our database.

### Relational Fields

| Field Name | Type | Comodel | Description |
|------------|------|---------|-------------|
| `product_tmpl_id` | Many2one | product.template | Parent template |
| `attribute_line_ids` | One2many | product.template.attribute.line | Product attributes |
| `product_variant_ids` | Many2many | product.product | Variants |
| `uom_id` | Many2one | uom.uom | Unit of measure |
| `uom_po_id` | Many2one | uom.uom | Purchase UoM |
| `taxes_id` | Many2many | account.tax | Customer taxes |
| `supplier_taxes_id` | Many2many | account.tax | Vendor taxes |

### Other Useful Fields

| Field Name | Type | Description | Our Implementation |
|------------|------|-------------|-------------------|
| `active` | Boolean | Is active | ✅ Used |
| `sale_ok` | Boolean | Can be sold | ✅ Used |
| `purchase_ok` | Boolean | Can be purchased | ✅ Not used |
| `type` | Selection | Product type: consu/service/product | ⚠️ Not synced |
| `sequence` | Integer | Display order | ✅ Synced |
| `barcode` | Char | Barcode/EAN | ⚠️ Not synced |
| `weight` | Float | Product weight | ⚠️ Not synced |
| `volume` | Float | Product volume | ⚠️ Not synced |

---

## Product Template Model (product.template)

**Model Name:** `product.template`  
**Description:** Product template - main product without variants

### Template-Specific Fields

| Field Name | Type | Description | Notes |
|------------|------|-------------|-------|
| `website_published` | Boolean | Published on website | ❌ Doesn't exist in v19 |
| `is_published` | Boolean | Is published (website) | ✅ Use this instead |
| `website_description` | Html | Website description | ✅ Available |
| `website_sequence` | Integer | Website order | ✅ Available |
| `public_categ_ids` | Many2many | Public categories | ✅ Available |

### Variant Management

| Field Name | Type | Description |
|------------|------|-------------|
| `product_variant_ids` | One2many | List of variants |
| `product_variant_count` | Integer | Number of variants |
| `attribute_line_ids` | One2many | Variant attributes |

---

## Product Category Model (product.category)

**Model Name:** `product.category`  
**Description:** Product categories (hierarchical)

### Available Fields

| Field Name | Type | Description | Available in v19? |
|------------|------|-------------|-------------------|
| `id` | Integer | Category ID | ✅ Yes |
| `name` | Char | Category name | ✅ Yes |
| `display_name` | Char | Full hierarchical name | ✅ Yes |
| `complete_name` | Char | Complete path name | ✅ Yes |
| `parent_id` | Many2one | Parent category | ✅ Yes |
| `child_id` | One2many | Child categories | ✅ Yes |
| `parent_path` | Char | Hierarchy path | ✅ Yes |

### Fields NOT Available

| Field Name | Status | Alternative |
|------------|--------|-------------|
| `sequence` | ❌ Not in v19 | Use custom ordering |
| `product_count` | ❌ Not stored | Calculate on frontend |
| `website_published` | ❌ Not in product.category | N/A |

---

## Image Fields

### Understanding Image Storage

Odoo stores images as **base64-encoded binary data** in the database:

```python
# Odoo internal format
{
  "id": 609,
  "name": "Americano",
  "image_1920": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD...",  # base64 string
  "image_128": "iVBORw0KGgoAAAANSUhEUgAAAIAAAACA..."    # base64 string
}
```

### Image Field Hierarchy

All image fields are **computed from `image_1920`**:
- `image_1920`: Original uploaded image (max 1920x1920)
- `image_1024`: Auto-resized from image_1920
- `image_512`: Auto-resized from image_1920
- `image_256`: Auto-resized from image_1920
- `image_128`: Auto-resized from image_1920

**Best Practice:** Only fetch the size you need to reduce payload.

### Current Status

Our database shows:
```json
{
  "id": "609",
  "name": "Americano",
  "images": []  // Empty - no images uploaded to Odoo
}
```

**Action Required:** Upload product images via Odoo UI.

---

## Field Types Reference

### From Odoo ORM Documentation

| Odoo Type | Python Type | PostgreSQL Type | Description |
|-----------|-------------|-----------------|-------------|
| Boolean | bool | boolean | True/False |
| Char | str | varchar | Short text (size limit) |
| Text | str | text | Long text (no limit) |
| Integer | int | integer | Whole numbers |
| Float | float | double precision | Decimal numbers |
| Monetary | float | double precision | Currency amounts |
| Date | date | date | Date only |
| Datetime | datetime | timestamp | Date + time |
| Binary | bytes | bytea | Binary data (images, files) |
| Selection | str | varchar | Predefined choices |
| Many2one | int | integer | Foreign key (ID) |
| One2many | list[int] | N/A | Reverse FK |
| Many2many | list[int] | N/A | Join table |

### Selection Field Values

```python
# Product type
type = fields.Selection([
    ('consu', 'Consumable'),
    ('service', 'Service'),
    ('product', 'Storable Product'),
])
```

---

## API Methods

### 1. Authentication

```json
POST /jsonrpc
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "service": "common",
    "method": "authenticate",
    "args": [DB_NAME, USERNAME, PASSWORD, {}]
  },
  "id": 1
}

Response:
{
  "result": 2  // User ID
}
```

### 2. Read Records (`search_read`)

```json
POST /jsonrpc
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "service": "object",
    "method": "execute_kw",
    "args": [
      DB_NAME,
      UID,
      PASSWORD,
      "product.product",
      "search_read",
      [
        [["sale_ok", "=", true], ["active", "=", true]]  // Domain
      ],
      {
        "fields": ["id", "name", "list_price", "qty_available"],
        "limit": 100,
        "offset": 0,
        "order": "sequence, name"
      }
    ]
  },
  "id": 2
}
```

### 3. Get Field Definitions (`fields_get`)

```json
POST /jsonrpc
{
  "method": "call",
  "params": {
    "service": "object",
    "method": "execute_kw",
    "args": [
      DB_NAME,
      UID,
      PASSWORD,
      "product.product",
      "fields_get",
      [],
      {
        "attributes": ["string", "type", "help", "required", "readonly"]
      }
    ]
  }
}

Response:
{
  "result": {
    "name": {
      "type": "char",
      "string": "Product Name",
      "required": true,
      "help": "Name of the product"
    },
    "list_price": {
      "type": "float",
      "string": "Sales Price",
      "help": "Price for selling"
    }
    ...
  }
}
```

### 4. Read Single Record (`read`)

```json
POST /jsonrpc
{
  "params": {
    "args": [
      DB_NAME,
      UID,
      PASSWORD,
      "product.product",
      "read",
      [[609]],  // IDs array
      ["name", "list_price", "image_128"]
    ]
  }
}
```

---

## Current Implementation

### What We're Syncing Now

**Products (17 fields):**
```typescript
[
  'id', 'name', 'default_code', 'list_price',
  'categ_id', 'uom_id', 'taxes_id',
  'active', 'sale_ok',
  'image_1920', 'image_1024', 'image_512', 'image_256', 'image_128',
  'description_sale', 'qty_available', 'virtual_available'
]
```

**Categories (5 fields):**
```typescript
['id', 'name', 'parent_id', 'display_name', 'complete_name']
```

### Data Flow

```
Odoo Database
    ↓
OdooClient.searchRead() [JSON-RPC]
    ↓
normalizeProduct() / normalizeCategory()
    ↓
Redis Cache (products:all, categories:list)
    ↓
API Routes (/api/products, /api/categories)
    ↓
React Hooks (useProducts, useCategories)
    ↓
Components
```

### Current Product Type

```typescript
interface Product {
  id: string;
  name: string;           // ✅ Synced
  description: string | null;  // ✅ Synced (but all null)
  sku: string;            // ✅ Synced (default_code)
  price: number;          // ✅ Synced (list_price)
  images: string[];       // ✅ Synced (but all empty [])
  available: boolean;     // ✅ Computed
  stock: number | null;   // ✅ Synced
  sequence: number;       // ✅ Synced
  uom?: { id: number; name: string };  // ✅ Synced
  taxes?: number[];       // ✅ Synced
}
```

---

## Recommendations

### Immediate Actions

1. **Upload Product Images to Odoo**
   - Go to Odoo UI → Inventory → Products
   - Edit each product
   - Upload image in `image_1920` field
   - Save
   - Re-run sync endpoint

2. **Add Product Descriptions**
   - Fill `description_sale` field in Odoo
   - This will appear as `description` in our API

3. **Update Stock Levels**
   - Set proper `qty_available` values in Odoo Inventory

### Fields to Consider Adding

**High Value:**
- `barcode`: For POS integration
- `type`: To distinguish products/services
- `weight`: For shipping calculations
- `is_published`: Website visibility control

**Medium Value:**
- `product_variant_ids`: Support for product variants (sizes, colors)
- `attribute_line_ids`: Variant attributes
- `website_description`: Rich HTML descriptions
- `public_categ_ids`: Public-facing categories

**Low Priority:**
- `volume`: For storage planning
- `sale_delay`: Delivery time
- `tracking`: Serial/lot number tracking

### API Optimizations

1. **Pagination:** Already implemented (`limit`, `offset`)
2. **Field Selection:** Only fetch needed fields
3. **Image Optimization:** Use `image_128` for thumbnails, `image_512` for details
4. **Caching:** Redis cache with TTL (already implemented)
5. **Incremental Sync:** Track `write_date` to sync only modified products

### Product Details Page Needs

For a comprehensive product details page, we should fetch:

**Essential:**
- `id`, `name`, `list_price`
- `description_sale` (rich description)
- `image_512` or `image_1024` (larger images)
- `qty_available` (stock status)
- `categ_id` (category)

**Nice to Have:**
- `product_variant_ids` (if product has variants)
- `attribute_line_ids` (variant options)
- `alternative_product_ids` (related products)
- `accessory_product_ids` (accessories)

---

## Example API Calls

### Get Single Product (Full Details)

```bash
curl -X POST 'https://elite.odoo.com/jsonrpc' \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "call",
    "params": {
      "service": "object",
      "method": "execute_kw",
      "args": [
        "elite",
        2,
        "API_KEY",
        "product.product",
        "search_read",
        [[["id", "=", 609]]],
        {
          "fields": [
            "id", "name", "default_code", "list_price",
            "description_sale", "qty_available",
            "image_512", "categ_id", "uom_id",
            "product_variant_ids", "attribute_line_ids"
          ],
          "limit": 1
        }
      ]
    },
    "id": 1
  }'
```

### Get Product with Related Products

```bash
# First get product
# Then fetch related products using product_variant_ids or alternative_product_ids
```

---

## Testing Commands

### Via Next.js API

```bash
# Get all products
curl -s 'http://localhost:3000/api/products' | jq '.'

# Get single product
curl -s 'http://localhost:3000/api/products?id=609' | jq '.'

# Get categories
curl -s 'http://localhost:3000/api/categories' | jq '.'

# Sync products
curl -X POST 'http://localhost:3000/api/sync/products' \
  -H "x-admin-token: change-me"
```

---

## References

- [Odoo 19 ORM API Documentation](https://www.odoo.com/documentation/19.0/developer/reference/backend/orm.html)
- [Product Model Source Code](https://github.com/odoo/odoo/blob/19.0/addons/product/models/product.py)
- [Stock Model Source Code](https://github.com/odoo/odoo/blob/19.0/addons/stock/models/product.py)

---

**Last Updated:** December 6, 2025  
**Status:** ✅ Ready for implementation
