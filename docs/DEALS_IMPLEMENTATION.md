# Monday Morning Deals Implementation

## Overview

This document describes the implementation of the Monday Morning Deals feature, which provides time-based pricing for selected products every Monday from 8:00 AM to 1:00 PM.

## Architecture

### Components

1. **Odoo Pricelist Setup Script** (`scripts/create-monday-deals-pricelist.ts`)
   - Creates or updates the "Monday Morning Deals" pricelist in Odoo
   - Configures fixed prices for deal products:
     - 40 EGP: Iced Latte, Hot Latte, Iced Cappuccino, Hot Cappuccino
     - 25 EGP: Espresso, Turkish Coffee

2. **Time Validation** (`src/lib/deals/timeValidation.ts`)
   - Validates if deals are currently active (Monday 8:00 AM - 1:00 PM)
   - Provides utilities for displaying time until next deal

3. **API Endpoint** (`src/app/api/deals/route.ts`)
   - Fetches products with deal pricelist applied
   - Returns both original and deal prices
   - Includes deal validity status

4. **React Hook** (`src/hooks/useDeals.ts`)
   - Client-side hook for fetching deals
   - Manages loading, error, and deal status states

5. **Deals Page** (`src/app/deals/page.tsx`)
   - Displays deal products with price comparison
   - Shows deal status banner
   - Handles add-to-cart functionality

6. **Odoo Client Extensions** (`src/server/utils/odooClient.ts`)
   - Added `findPricelistByName()` method
   - Added `getProductPriceWithPricelist()` method

## Setup Instructions

### 1. Create Pricelist in Odoo

Run the setup script to create the pricelist and configure products:

```bash
npx tsx scripts/create-monday-deals-pricelist.ts
```

This script will:
- Find products by name (Iced Latte, Hot Latte, etc.)
- Create or find the "Monday Morning Deals" pricelist
- Create/update pricelist items with fixed prices

### 2. Verify Products Exist

Ensure the following products exist in Odoo with exact names:
- Iced Latte
- Hot Latte
- Iced Cappuccino
- Hot Cappuccino
- Espresso
- Turkish Coffee

If product names differ, update the `DEAL_PRODUCTS` constant in the script.

## How It Works

### Price Enforcement

1. **Odoo as Source of Truth**: All prices are stored and enforced by Odoo
2. **Pricelist Context**: When fetching products, the pricelist is applied to get deal prices
3. **Time Validation**: Frontend validates time window, but Odoo enforces final price at checkout

### User Flow

1. User visits `/deals` page
2. Page fetches products with deal pricelist applied
3. If deal is active (Monday 8:00 AM - 1:00 PM):
   - Products show deal prices
   - Add-to-cart is enabled
4. If deal is not active:
   - Products show original prices
   - Deal prices are shown as "Deal: X EGP"
   - Add-to-cart may be disabled or show message
5. At checkout, Odoo validates final prices

### Time Validation

- **Frontend**: Validates time for UX (showing/hiding deals, enabling buttons)
- **Backend**: API can check time but doesn't block requests
- **Odoo**: Final price enforcement happens when order is placed

**Note**: Time is validated in the application's local timezone. For production, consider using Egypt/Cairo timezone.

## API Endpoints

### GET /api/deals

Fetches products with deal pricelist applied.

**Query Parameters**:
- `includeInactive` (boolean): Include products even when deal is not active (default: false)

**Response**:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "123",
        "name": "Iced Latte",
        "originalPrice": 50,
        "dealPrice": 40,
        "dealActive": true,
        "savings": 10,
        "savingsPercent": 20,
        ...
      }
    ],
    "dealActive": true,
    "pricelistId": 1,
    "count": 6
  }
}
```

## Caching Strategy

- Deals API uses the same caching strategy as `/api/products`
- Products are cached in Redis with 7-day TTL
- Deal prices are fetched from Odoo pricelist items (not cached separately)
- Time validation happens on every request (not cached)

## Important Notes

1. **Time Zone**: Currently uses local server time. For production, configure to use Egypt/Cairo timezone.

2. **Price Validation**: The cart validates prices against cached product prices. During deal time, deal prices should match. If there's a mismatch, Odoo will enforce the correct price at checkout.

3. **Pricelist Availability**: The pricelist must be:
   - Active in Odoo
   - Available for website orders
   - Products must have `sale_ok = true`

4. **Product Matching**: The script searches for products by name. If product names in Odoo differ, update the `DEAL_PRODUCTS` constant.

## Testing

1. **Setup Pricelist**:
   ```bash
   npx tsx scripts/create-monday-deals-pricelist.ts
   ```

2. **Validate Setup**:
   ```bash
   npx tsx scripts/validate-deals-setup.ts
   ```
   This will check:
   - Odoo connection
   - Pricelist existence
   - Pricelist items
   - Product matching

3. **API Test**:
   ```bash
   curl http://localhost:3000/api/deals?includeInactive=true
   ```

4. **Page Test**:
   - Visit `http://localhost:3000/deals`
   - Verify products display with correct prices
   - Test add-to-cart during active and inactive periods
   - Check time validation (should show different states on Monday 8 AM - 1 PM vs other times)

## Troubleshooting

### Pricelist Not Found
- Run the setup script: `npx tsx scripts/create-monday-deals-pricelist.ts`
- Verify pricelist exists in Odoo: Sales > Configuration > Pricelists

### Products Not Showing
- Verify products exist in Odoo with exact names
- Check that products have `sale_ok = true`
- Ensure products are synced: Check `/api/products` endpoint

### Prices Not Matching
- Verify pricelist items are created correctly
- Check that pricelist is active
- Ensure product IDs match between products and pricelist items

### Time Validation Issues
- Check server timezone settings
- Verify `isDealActive()` function logic
- Test with different times to ensure Monday 8 AM - 1 PM window works

## Deal Types Available

See `docs/DEAL_TYPES_REFERENCE.md` for a complete list of all possible deal types, their durations, time windows, and configurations.

### Quick Reference:
- **Time-Based**: Monday Morning, Happy Hour, Weekend Specials, Early Bird, Late Night
- **Date Range**: Flash Sales, Seasonal Promotions, Holiday Specials
- **Percentage**: Global, Category, Product-specific discounts
- **Fixed Price**: Product or category fixed prices
- **Combination**: Buy X Get Y, Volume discounts, Combo deals
- **Customer Segment**: VIP, New Customer, Loyalty tier discounts

## Future Enhancements

1. **Timezone Support**: Use proper timezone handling (e.g., `date-fns-tz`)
2. **Multiple Deal Windows**: Support multiple time windows or days
3. **Deal Categories**: Group deals by category or type
4. **Deal History**: Track deal usage and analytics
5. **Admin Panel**: UI for managing deals without running scripts
6. **Date Range Support**: Automatic handling of Odoo date_from/date_to fields
7. **Recurring Patterns**: Support for multiple recurring time windows

