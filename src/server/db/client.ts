/// <reference types="node" />
import { PrismaClient } from "@prisma/client";

// Avoid instantiating multiple clients in dev hot-reload
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const databaseUrl = process.env.DATABASE_URL;

const prismaClient =
  globalForPrisma.prisma ??
  (databaseUrl
    ? new PrismaClient({
        log:
          process.env.NODE_ENV === "development"
            ? ["error", "warn"]
            : ["error"],
        datasources: {
          db: {
            url: databaseUrl,
          },
        },
        // @ts-expect-error - Internal Prisma engine config for serverless connection pooling
        __internal: {
          engine: {
            connection_limit: 10, // Max connections per serverless invocation
          },
        },
      })
    : null);

export const prisma: PrismaClient =
  prismaClient ??
  (new Proxy(
    {},
    {
      get() {
        throw new Error(
          "DATABASE_URL is not set. Prisma client is unavailable.",
        );
      },
    },
  ) as PrismaClient);

if (process.env.NODE_ENV === "development" && prismaClient) {
  globalForPrisma.prisma = prismaClient;
}
