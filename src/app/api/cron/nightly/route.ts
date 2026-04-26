/**
 * Nightly cron orchestrator — runs all scheduled jobs sequentially.
 * This is the ONLY cron entry in vercel.json (free tier = 1 cron slot).
 * Individual job routes remain callable manually via their own paths.
 *
 * Schedule: 0 3 * * * (daily at 3am UTC)
 * Jobs: product sync → odoo retry → daily inventory summary
 */

import { NextRequest, NextResponse } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return jsonResponse(errorResponse("Unauthorized"), 401);
  }

  const base =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  if (!base) {
    return jsonResponse(errorResponse("NEXTAUTH_URL not set"), 500);
  }

  const headers: Record<string, string> = {
    authorization: `Bearer ${cronSecret}`,
  };

  const adminToken = process.env.ADMIN_TOKEN;
  const results: Record<string, unknown> = {};

  // 1. Product sync
  try {
    const res = await fetch(`${base}/api/sync/products`, {
      method: "POST",
      headers: { "x-admin-token": adminToken ?? "" },
    });
    results.productSync = { status: res.status, ok: res.ok };
    console.log("[cron:nightly] product-sync:", res.status);
  } catch (err) {
    results.productSync = {
      error: err instanceof Error ? err.message : String(err),
    };
    console.error("[cron:nightly] product-sync failed:", err);
  }

  // 2. Odoo retry
  try {
    const res = await fetch(`${base}/api/cron/retry-odoo-sync`, { headers });
    results.odooRetry = { status: res.status, ok: res.ok };
    console.log("[cron:nightly] odoo-retry:", res.status);
  } catch (err) {
    results.odooRetry = {
      error: err instanceof Error ? err.message : String(err),
    };
    console.error("[cron:nightly] odoo-retry failed:", err);
  }

  // 3. Daily inventory summary email
  try {
    const res = await fetch(`${base}/api/cron/daily-summary`, { headers });
    results.dailySummary = { status: res.status, ok: res.ok };
    console.log("[cron:nightly] daily-summary:", res.status);
  } catch (err) {
    results.dailySummary = {
      error: err instanceof Error ? err.message : String(err),
    };
    console.error("[cron:nightly] daily-summary failed:", err);
  }

  const allOk = Object.values(results).every(
    (r) => (r as { ok?: boolean }).ok === true,
  );

  console.log("[cron:nightly] Done.", results);
  return NextResponse.json(
    successResponse(results, allOk ? "All jobs completed" : "Some jobs failed"),
    { status: allOk ? 200 : 207 },
  );
}
