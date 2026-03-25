/// <reference types="node" />
import { PrismaClient } from "@prisma/client";

// Avoid instantiating multiple clients in dev hot-reload
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // @ts-expect-error - Internal Prisma engine config for serverless connection pooling
    __internal: {
      engine: {
        connection_limit: 10, // Max connections per serverless invocation
      },
    },
  });

if (process.env.NODE_ENV === "development") {
  globalForPrisma.prisma = prisma;
}
