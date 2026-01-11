import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { PaymentMethod } from "@/types";

const updateSchema = z.object({
  enabledPaymentMethods: z.array(z.nativeEnum(PaymentMethod)).min(1).optional(),
  deliveryFee: z.number().min(0).max(1000).optional(),
  codFee: z.number().min(0).max(1000).optional(),
});

/**
 * GET /api/admin/checkout-config
 * Admin-only checkout configuration.
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);

    const row = await prisma.checkoutConfig.findUnique({
      where: { id: "checkout" },
    });
    if (!row) {
      return jsonResponse(
        successResponse({
          enabledPaymentMethods: [PaymentMethod.CASH],
          deliveryFee: 15,
          codFee: 0,
        }),
      );
    }

    return jsonResponse(
      successResponse({
        enabledPaymentMethods: row.enabledPaymentMethods,
        deliveryFee: Number(row.deliveryFee),
        codFee: Number(row.codFee),
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch checkout config";
    const isAuthError =
      error instanceof Error && error.message.includes("Required role");
    return jsonResponse(errorResponse(message), isAuthError ? 403 : 500);
  }
}

/**
 * PATCH /api/admin/checkout-config
 * Admin-only update.
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);

    const raw = await request.json();
    const parsed = updateSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonResponse(
        errorResponse(
          "Invalid request body",
          parsed.error.issues.map((i) => i.message).join("; "),
        ),
        400,
      );
    }

    const data = parsed.data;

    const updated = await prisma.checkoutConfig.upsert({
      where: { id: "checkout" },
      create: {
        id: "checkout",
        enabledPaymentMethods: data.enabledPaymentMethods ?? [
          PaymentMethod.CASH,
        ],
        deliveryFee: data.deliveryFee ?? 15,
        codFee: data.codFee ?? 0,
      },
      update: {
        ...(data.enabledPaymentMethods
          ? { enabledPaymentMethods: data.enabledPaymentMethods }
          : {}),
        ...(data.deliveryFee !== undefined
          ? { deliveryFee: data.deliveryFee }
          : {}),
        ...(data.codFee !== undefined ? { codFee: data.codFee } : {}),
      },
      select: {
        enabledPaymentMethods: true,
        deliveryFee: true,
        codFee: true,
      },
    });

    return jsonResponse(
      successResponse({
        enabledPaymentMethods: updated.enabledPaymentMethods,
        deliveryFee: Number(updated.deliveryFee),
        codFee: Number(updated.codFee),
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update checkout config";
    const isAuthError =
      error instanceof Error && error.message.includes("Required role");
    return jsonResponse(errorResponse(message), isAuthError ? 403 : 500);
  }
}
