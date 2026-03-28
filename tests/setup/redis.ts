import { vi } from "vitest";

// Globally hijack the redis implementation so testing doesn't stall on missing connections
vi.mock("@/server/cache/redis", () => {
  const store = new Map<string, any>();

  const toNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return {
    redisGet: vi.fn(async (key: string) => store.get(key) || null),
    redisSet: vi.fn(async (key: string, value: any) => {
      store.set(key, value);
    }),
    redisDel: vi.fn(async (key: string) => store.delete(key)),
    redisIncr: vi.fn(async (key: string) => {
      const next = toNumber(store.get(key)) + 1;
      store.set(key, next);
      return next;
    }),
    redisDecr: vi.fn(async (key: string) => {
      const next = toNumber(store.get(key)) - 1;
      store.set(key, next);
      return next;
    }),
    redisExpire: vi.fn(async () => true),
    redisTtl: vi.fn(async () => -1),
    redisSetNx: vi.fn(async (key: string, value: string) => {
      if (store.has(key)) return false;
      store.set(key, value);
      return true;
    }),
    redisQuit: vi.fn(async () => {
      store.clear();
    }),
  };
});
