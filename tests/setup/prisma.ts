import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended";
import { prisma } from "@/server/db/client";
import { beforeEach, vi } from "vitest";

// Mock the prisma client internal mapping globally without calling the real DB
vi.mock("@/server/db/client", () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

// Ensure clean slate between test isolations
beforeEach(() => {
  mockReset(prismaMock);
});
