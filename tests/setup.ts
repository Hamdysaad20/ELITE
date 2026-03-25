/**
 * Universal Vitest Configuration Hub
 * Initializes Global mock frameworks across all suites.
 */
import { afterAll, vi } from "vitest";

// Inject deep proxy mocks protecting live instances
import "./setup/prisma";
import "./setup/redis";

import { prisma } from "@/server/db/client";

// Prevent lingering execution context overhead
afterAll(async () => {
  if (prisma.$disconnect) await prisma.$disconnect();
  vi.clearAllMocks();
});
