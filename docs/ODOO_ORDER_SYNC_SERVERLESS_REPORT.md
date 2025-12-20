# Odoo Order Sync (Serverless) — Production Review Report

**Date:** 2025-12-20  
**Scope:** Website order → Odoo Sale Order sync behavior on Vercel

## What we observed (Vercel logs)

The production logs show the expected behavior:

- A worker start was attempted, but **another instance held the distributed lock**:
  - `[odoo-worker] Another instance is running the worker (distributed lock held)`
  - `[odoo-worker] Worker already running on another instance`
- The order sync itself ran via the **serverless inline path** and completed successfully:
  - `[odooSync] Serverless detected, running inline sync for order ...`
  - `[odooSync] Creating sale order for ...`
  - `[odooSync] Sale order created: 18 for order ...`
  - `[odooSync] Order ... sync completed successfully`

This matches the current implementation where **serverless runs inline sync** and does not depend on a queue worker for order creation.

## Current implementation (code-backed)

### Call chain

- Order creation route calls `enqueueOrderSync(...)` after inserting the Order:

```215:235:src/app/api/orders/route.ts
    // Enqueue Odoo sync (fire-and-forget stub). Defaults: sale enabled, pos disabled.
    const enableSale = body.odoo?.sale?.enable !== false;
    const enablePos = body.odoo?.pos?.enable === true;
    await enqueueOrderSync({
      orderId: created.id,
      clientOrderRef: clientOrderRef,
      partner: {
        name: body.odoo?.partner?.name || authUser?.name || "Website Customer",
        email: body.odoo?.partner?.email || authUser?.email,
        phone: addressInfo?.phone || body.odoo?.partner?.phone,
        street: addressInfo?.street || body.odoo?.partner?.street,
        city: addressInfo?.city || body.odoo?.partner?.city,
        zip: addressInfo?.zip || body.odoo?.partner?.zip,
      },
      enableSale,
      autoConfirm: body.odoo?.sale?.autoConfirm === true,
      enablePos,
      posConfigId: body.odoo?.pos?.posConfigId,
      posConfigName: body.odoo?.pos?.posConfigName,
      customerNotePerLine: body.odoo?.pos?.customerNotePerLine,
    });
```

- In **serverless (Vercel/Netlify)**, `enqueueOrderSync` runs `processOrderSync` inline (single execution path):

```12:48:src/server/services/odooSync.ts
export async function enqueueOrderSync(payload: OrderSyncPayload): Promise<void> {
  const isServerlessEnv = process.env.VERCEL === "1" || process.env.NETLIFY === "true";

  if (isServerlessEnv) {
    console.log(`[odooSync] Serverless detected, running inline sync for order ${payload.orderId}`);
    try {
      await processOrderSync(payload);
    } catch (err) {
      console.error(`[odooSync] Order sync failed for ${payload.orderId}:`, err);
      // ... updates odooStatusSale/odooStatusPos to failed/skipped ...
    }
    return;
  }
  // ... non-serverless queue path ...
}
```

## Why this approach is correct on Vercel

Vercel serverless functions do not provide a reliable “always-on” background process. A BullMQ worker may start, but it is not guaranteed to stay alive long enough to drain a queue continuously.

So the implementation intentionally chooses:

- **Serverless:** inline sync (reliable “do it now”)
- **Non-serverless:** queue + worker (reliable “do it async + retries”)

## Known drawbacks / corner cases (and mitigations)

### 1) API latency / serverless max duration

- **What happens:** on serverless, the order creation request now includes the Odoo sync time (until success/timeout).
- **Risk:** if Odoo is slow/down, the request can run up to `ODOO_TIMEOUT_MS` and could approach/exceed the platform’s max duration.
- **Mitigation:** tune `ODOO_TIMEOUT_MS` to stay safely below your platform’s max duration, and/or move to a **separate worker service** for true async retries.

### 2) No automatic retry in serverless mode

- In serverless inline mode, we attempt once; on failure we mark order sync status as `failed`.
- **Mitigation:** add an ops/admin “retry sync” endpoint or scheduled re-sync if you need automatic recovery (not implemented in this change).

### 3) Worker logs on Vercel

You may still see `[odoo-worker] ... distributed lock held` logs due to auto-start attempts.

- **Mitigation:** set `ENABLE_ODOO_WORKER=false` on Vercel if you are using serverless inline order sync and don’t want worker startup attempts/log noise.

## Recommended Vercel configuration (orders)

- **Use inline sync for orders**
- Set:
  - `ENABLE_ODOO_WORKER=false` (recommended to avoid worker start attempts)
  - `ODOO_TIMEOUT_MS` based on your Odoo performance (default is 60s; raise only if your platform duration allows it)


