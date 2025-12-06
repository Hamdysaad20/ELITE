# Backend Scaffold (v1) – Redis + /sync/products

## Redis Helper (TypeScript sketch)
```ts
// src/cache/redis.ts
import { createClient } from "redis";

const client = createClient({ url: process.env.REDIS_URL });
client.on("error", (err) => console.error("Redis error", err));
await client.connect();

export const redis = {
  get: <T>(key: string) => client.get(key).then((v) => (v ? JSON.parse(v) as T : null)),
  set: (key: string, value: unknown, ttlSeconds?: number) =>
    ttlSeconds
      ? client.setEx(key, ttlSeconds, JSON.stringify(value))
      : client.set(key, JSON.stringify(value)),
  del: (key: string) => client.del(key),
};
```

## /sync/products Handler (sketch)
```ts
// src/routes/sync.ts
import type { Request, Response } from "express";
import { redis } from "../cache/redis";
import { odooClient } from "../services/odooClient";
import { normalizeProducts } from "../services/catalogSync";

export async function postSyncProducts(req: Request, res: Response) {
  // Simple admin guard
  if (req.headers["x-admin-token"] !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ success: false, error: "forbidden" });
  }

  try {
    const raw = await odooClient.fetchProducts(); // implement using existing searchRead logic
    const { products, categories, etag } = normalizeProducts(raw);

    // Write categories
    await redis.set("categories:list", categories);

    // Write individual products
    for (const p of products) {
      await redis.set(`products:${p.id}`, p);
    }

    // Write a default list page (page 1)
    const pageSize = 50;
    await redis.set(
      `products:list:1:${pageSize}:all`,
      products.slice(0, pageSize).map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        categoryId: p.categoryId,
        available: p.available,
        images: p.images?.slice(0, 1) || [],
      })),
    );

    const now = new Date().toISOString();
    await redis.set("sync:last_update", now);
    if (etag) await redis.set("sync:etag", etag);

    return res.json({
      success: true,
      data: { products: products.length, categories: categories.length, lastUpdate: now },
    });
  } catch (err: any) {
    console.error("sync/products failed", err);
    return res.status(500).json({ success: false, error: err?.message || "sync failed" });
  }
}
```

## normalizeProducts (sketch)
```ts
// src/services/catalogSync.ts
import crypto from "node:crypto";

export function normalizeProducts(raw: any[]) {
  const products = raw.map((r) => ({
    id: String(r.id),
    title: r.name,
    sku: r.default_code || String(r.id),
    price: r.list_price ?? 0,
    categoryId: Array.isArray(r.categ_id) ? r.categ_id[0] : r.categ_id,
    available: r.active !== false,
    images: r.image_1024 ? [`data:image/png;base64,${r.image_1024}`] : [],
    attributes: r.attributes ?? [],
    uom: r.uom_id ? { id: r.uom_id[0], name: r.uom_id[1] } : undefined,
    taxes: Array.isArray(r.taxes_id) ? r.taxes_id : [],
  }));

  // categories can be gathered separately; include here if raw includes them
  const categories = [];

  const etag = crypto.createHash("sha1").update(JSON.stringify(products)).digest("hex");
  return { products, categories, etag };
}
```

## POS Availability Cache (Express middleware sketch)
```ts
// src/routes/pos.ts
export async function getPosAvailability(req, res) {
  const cached = await redis.get("pos:availability");
  if (cached) return res.json({ success: true, data: cached, cached: true });

  const client = odooClient.instance();
  const ping = await client.ping().catch(() => null);
  const hasPos = await client.modelExists("pos.order").catch(() => false);
  if (!hasPos) {
    const data = { hasPos: false, configs: [], ping };
    await redis.set("pos:availability", data, 60);
    return res.json({ success: true, data });
  }
  const configs = await client.getPosConfigs();
  const withSession = await Promise.all(
    configs.map(async (c) => ({ ...c, openSessionId: await client.getOpenPosSession(c.id) })),
  );
  const data = { hasPos, configs: withSession, ping };
  await redis.set("pos:availability", data, 60);
  return res.json({ success: true, data });
}
```

## Notes
- Wire cron (Vercel Cron/Cloud Run Scheduler) to call `/sync/products`.
- Add rate-limit/lock to avoid overlapping sync runs.
- For production, batch Redis writes (pipeline) for speed. 
- Run the Odoo sync worker separately: `npm run worker:odoo` (requires `REDIS_URL`). Queue is BullMQ (`odoo-sync`).
- Odoo 19: prefer `ODOO_API_KEY`, keep JSON-RPC `/jsonrpc`, POS still requires open session and `available_in_pos`.
- Cron example (Vercel): `*/10 * * * *` → `POST https://<host>/api/sync/products` with `x-admin-token`.

