/**
 * Vitest setup file
 * Runs before all tests
 */

import { beforeAll, afterAll } from "vitest";
import { prisma } from "../src/server/db/client";

// Clean up database connections after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
