import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { prisma } from "@/server/db/client";
import { redisSet } from "@/server/cache/redis";
import { createOdooClient, isOdooConfigured } from "@/server/utils/odooClient";

export async function GET(_req: NextRequest) {
  try {
    // DB check
    let dbOk = false;
    try {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("DB timeout")), 5000),
        ),
      ]);
      dbOk = true;
    } catch (err) {
      console.error("Health DB check failed", err);
    }

    // Redis check
    let redisOk = false;
    try {
      const key = `health:pulse:${Date.now()}`;
      await Promise.race([
        redisSet(key, "ok", 5),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Redis timeout")), 5000),
        ),
      ]);
      redisOk = true;
    } catch (err) {
      console.error("Health Redis check failed", err);
    }

    // Odoo check
    let odooOk = false;
    const odooConfigured = isOdooConfigured();
    if (odooConfigured) {
      try {
        const odooClient = createOdooClient();
        if (odooClient) {
          await Promise.race([
            odooClient.ping(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Odoo timeout")), 8000),
            ),
          ]);
          odooOk = true;
        }
      } catch (err) {
        console.error("Health Odoo check failed", err);
      }
    }

    const ok = dbOk && redisOk && (!odooConfigured || odooOk);
    const data = {
      ok,
      db: dbOk,
      redis: redisOk,
      odoo: odooConfigured ? odooOk : "Not Configured",
      timestamp: new Date().toISOString(),
    };

    if (!ok) {
      return jsonResponse(
        errorResponse("Unhealthy", JSON.stringify(data)),
        503,
      );
    }
    return jsonResponse(successResponse(data, "Healthy"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Health check failed";
    return jsonResponse(errorResponse(message), 500);
  }
}
