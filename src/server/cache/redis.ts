import { createClient } from "redis";

type ClientType = ReturnType<typeof createClient>;

const POOL_SIZE = process.env.REDIS_POOL_SIZE
  ? parseInt(process.env.REDIS_POOL_SIZE, 10)
  : 5;
let clients: ClientType[] = [];
let nextClientIndex = 0;

function getClient(): ClientType {
  if (clients.length === POOL_SIZE) {
    const client = clients[nextClientIndex];
    nextClientIndex = (nextClientIndex + 1) % clients.length;
    return client;
  }

  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not set");
  }

  for (let i = 0; i < POOL_SIZE; i++) {
    const c = createClient({
      url,
      socket: {
        connectTimeout: 5000, // 5 seconds timeout
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.error("Redis max retries reached");
            return new Error("Redis connection failed");
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    c.on("error", (err) => {
      if (
        err.code === "ECONNRESET" ||
        err.code === "ECONNREFUSED" ||
        err.code === "ETIMEDOUT"
      ) {
        if (process.env.NODE_ENV !== "development") {
          console.error(`Redis connection error (Client ${i}):`, err.code);
        }
      } else {
        console.error(`Redis error (Client ${i}):`, err);
      }
    });

    clients.push(c);
  }

  const client = clients[nextClientIndex];
  nextClientIndex = (nextClientIndex + 1) % clients.length;
  return client;
}

async function ensureConnected(): Promise<ClientType> {
  const c = getClient();
  if (!c.isOpen) {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Redis connection timeout")), 5000),
    );
    await Promise.race([c.connect(), timeout]);
  }
  return c;
}

export async function redisGet<T>(key: string): Promise<T | null> {
  try {
    const c = await ensureConnected();
    const val = await c.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch (err) {
    // Log but don't throw - allow graceful degradation
    if (process.env.NODE_ENV === "production") {
      console.error(
        `[REDIS] Get failed for key ${key}:`,
        err instanceof Error ? err.message : String(err),
      );
    }
    return null; // Return null on error (cache miss behavior)
  }
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
  // Note: Callers should handle errors gracefully for non-critical cache writes
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

export async function redisExpire(
  key: string,
  seconds: number,
): Promise<boolean> {
  const c = await ensureConnected();
  return await c.expire(key, seconds);
}

export async function redisTtl(key: string): Promise<number> {
  const c = await ensureConnected();
  return await c.ttl(key);
}

/**
 * Atomic lock using Redis SET NX EX (SET if Not eXists with EXpiration)
 * Returns true if lock was acquired, false if already locked
 */
export async function redisSetNx(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<boolean> {
  const c = await ensureConnected();
  // SET key value NX EX ttl - atomic operation
  // Returns "OK" if set, null if key already exists
  const result = await c.set(key, value, {
    NX: true, // Only set if not exists
    EX: ttlSeconds, // Expire after ttlSeconds
  });
  // node-redis returns "OK" string on success, null on failure (key exists)
  return result !== null && result !== undefined;
}

export async function redisQuit(): Promise<void> {
  await Promise.all(
    clients.map(async (c) => {
      if (c.isOpen) {
        await c.quit();
      }
    }),
  );
  clients = [];
  nextClientIndex = 0;
}
