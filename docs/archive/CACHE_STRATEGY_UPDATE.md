# 🚀 Cache Strategy Update: Stale-While-Revalidate

## Overview
We have improved the product synchronization mechanism to eliminate user waiting time. The system now uses a **Stale-While-Revalidate (SWR)** strategy with a "Soft TTL".

## 🔄 New Mechanism

### 1. Two-Layer Caching
*   **Hard TTL (7 Days)**: Data remains in Redis for 7 days. This ensures that even if no one visits the site for a few days, the data is still available immediately.
*   **Soft TTL (1 Hour)**: We track a `sync:last_update` timestamp. If the data is older than 1 hour, we consider it "stale".

### 2. Non-Blocking Updates
When a user requests data:
1.  **Check Cache**: We immediately check Redis.
2.  **Serve Fast**: If data exists (even if stale), we return it **immediately**. The user sees the page instantly.
3.  **Background Refresh**: If the data was stale (older than 1 hour), we trigger a background sync process.
    *   This process runs asynchronously.
    *   It updates the cache for the *next* user.
    *   We use a lock (`sync:lock`) to prevent multiple users from triggering the sync simultaneously.

### 3. Cold Start
Only the very first request after a complete cache flush (e.g., after 7 days of inactivity or manual flush) will wait for the sync.

## 🛠 Implementation Details

*   **Service**: `src/server/services/product.service.ts` handles the safe fetching logic.
*   **API Routes**: Updated `/api/products` and `/api/menu/proxy` to use this service.
*   **Sync Utility**: Updated `src/server/utils/syncProducts.ts` to use the 7-day TTL.

##  बेनिफिटs (Benefits)
*   **Zero Wait Time**: Users no longer wait for Odoo sync.
*   **Always Fresh-ish**: Data is automatically refreshed every hour if there is traffic.
*   **Resilient**: Even if Odoo is down, we serve the cached data for up to 7 days.
