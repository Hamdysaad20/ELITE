import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;

function getClient(): RedisClientType {
  if (client) return client;
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not set");
  }
  client = createClient({ url });
  client.on("error", (err) => {
    // Only log Redis errors once, not repeatedly
    if (err.code === "ECONNRESET" || err.code === "ECONNREFUSED") {
      // Silently handle connection issues in development
      if (process.env.NODE_ENV === "development") {
        // Don't spam console
      } else {
        console.error("Redis connection error:", err.code);
      }
    } else {
      console.error("Redis error:", err);
    }
  });
  return client;
}

async function ensureConnected(): Promise<RedisClientType> {
  const c = getClient();
  if (!c.isOpen) {
    await c.connect();
  }
  return c;
}

export async function redisGet<T>(key: string): Promise<T | null> {
  const c = await ensureConnected();
  const val = await c.get(key);
  return val ? (JSON.parse(val) as T) : null;
}

export async function redisSet(
  key: string,
  value: unknown,
  ttlSeconds?: number,
): Promise<void> {
  const c = await ensureConnected();
  const payload = JSON.stringify(value);
  if (ttlSeconds && ttlSeconds > 0) {
    await c.setEx(key, ttlSeconds, payload);
  } else {
    await c.set(key, payload);
  }
}

export async function redisDel(key: string): Promise<void> {
  const c = await ensureConnected();
  await c.del(key);
}

export async function redisIncr(key: string): Promise<number> {
  const c = await ensureConnected();
  return await c.incr(key);
}

export async function redisDecr(key: string): Promise<number> {
  const c = await ensureConnected();
  return await c.decr(key);
}

export async function redisExpire(key: string, seconds: number): Promise<boolean> {
  const c = await ensureConnected();
  return await c.expire(key, seconds);
}

export async function redisTtl(key: string): Promise<number> {
  const c = await ensureConnected();
  return await c.ttl(key);
}

export async function redisQuit(): Promise<void> {
  if (client && client.isOpen) {
    await client.quit();
  }
}

