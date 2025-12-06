/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { createOdooClient, isOdooConfigured } from "@/server/utils/odooClient";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { redisGet, redisSet } from "@/server/cache/redis";

const CACHE_KEY = "pos:availability";
const CACHE_TTL = 60; // seconds

export async function GET(_req: NextRequest) {
  try {
    const cached = await redisGet<any>(CACHE_KEY).catch(() => null);
    if (cached) {
      return jsonResponse(successResponse({ ...cached, cached: true }));
    }

    if (!isOdooConfigured()) {
      return jsonResponse(
        successResponse({ configured: false, hasPos: false }, "Odoo not configured"),
      );
    }

    const client = createOdooClient();
    if (!client)
      return jsonResponse(errorResponse("Failed to init Odoo client"), 500);

    const ping = await client.ping().catch(() => null);
    const hasPos = await client.modelExists("pos.order").catch(() => false);

    if (!hasPos) {
      const data = { configured: true, hasPos: false, configs: [], ping };
      await redisSet(CACHE_KEY, data, CACHE_TTL);
      return jsonResponse(successResponse(data, "POS module not available"));
    }

    const configs = await client.getPosConfigs();
    const withSession = await Promise.all(
      configs.map(async (c) => ({
        ...c,
        openSessionId: await client.getOpenPosSession(c.id),
      })),
    );

    const data = { configured: true, hasPos, configs: withSession, ping };
    await redisSet(CACHE_KEY, data, CACHE_TTL);

    return jsonResponse(
      successResponse(data, `Found ${withSession.length} POS configs`),
    );
  } catch (err: any) {
    const message =
      err?.message || "Failed to fetch POS availability";
    return jsonResponse(errorResponse(message), 500);
  }
}

