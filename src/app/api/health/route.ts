import { NextRequest } from "next/server";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";
import { prisma } from "@/server/db/client";
import { redisSet } from "@/server/cache/redis";

export async function GET(_req: NextRequest) {
  try {
    // DB check
    let dbOk = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch (err) {
      console.error("Health DB check failed", err);
    }

    // Redis check
    let redisOk = false;
    try {
      const key = `health:pulse:${Date.now()}`;
      await redisSet(key, "ok", 5);
      redisOk = true;
    } catch (err) {
      console.error("Health Redis check failed", err);
    }

    const ok = dbOk && redisOk;
    const data = { ok, db: dbOk, redis: redisOk, timestamp: new Date().toISOString() };

    if (!ok) {
      return jsonResponse(errorResponse("Unhealthy", JSON.stringify(data)), 503);
    }
    return jsonResponse(successResponse(data, "Healthy"));
  } catch (err: any) {
    return jsonResponse(errorResponse(err?.message || "Health check failed"), 500);
  }
}

