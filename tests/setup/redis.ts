import { vi } from "vitest";

// Globally hijack the redis implementation so testing doesn't stall on missing connections
vi.mock("@/server/cache/redis", () => {
  const store = new Map<string, any>();
  return {
    redisGet: vi.fn(async (key: string) => store.get(key) || null),
    redisSet: vi.fn(async (key: string, value: any) => {
      store.set(key, value);
    }),
    redisDel: vi.fn(async (key: string) => store.delete(key)),
  };
});
