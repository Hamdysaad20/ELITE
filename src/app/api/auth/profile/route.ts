import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { logAuthEvent, AuthEvent } from "@/server/auth/logger";
import { sanitizeInput, sanitizePhone } from "@/lib/sanitization";
import { z } from "zod";
import { createOdooClient } from "@/server/utils/odooClient";

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .nullable(),
});

/**
 * GET /api/auth/profile - Get current user profile
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        loyalty: {
          select: {
            points: true,
            totalSpent: true,
            level: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!profile) {
      return jsonResponse(errorResponse("User not found"), 404);
    }

    return jsonResponse(
      successResponse({
        ...profile,
        loyalty: profile.loyalty || {
          points: 0,
          totalSpent: 0,
          level: "bronze",
          updatedAt: new Date(),
        },
        orderCount: profile._count.orders,
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch profile";
    const isAuthError =
      error instanceof Error && error.message === "Authentication required";
    return jsonResponse(errorResponse(message), isAuthError ? 401 : 500);
  }
}

/**
 * PATCH /api/auth/profile - Update user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    // Validate input
    const validation = UpdateProfileSchema.safeParse(body);
    if (!validation.success) {
      return jsonResponse(
        errorResponse("Invalid input", JSON.stringify(validation.error.errors)),
        400,
      );
    }

    const { name, phone } = validation.data;

    // Sanitize inputs before updating to prevent XSS
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      updateData.name = sanitizeInput(name);
    }

    if (phone !== undefined) {
      updateData.phone = phone ? sanitizePhone(phone) : null;
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        updatedAt: true,
      },
    });

    logAuthEvent(
      AuthEvent.ACCOUNT_UPDATED,
      { userId: user.id, email: user.email },
      "info",
    );

    // Sync profile update to Odoo
    try {
      const odooClient = createOdooClient();
      if (odooClient && updatedUser.email) {
        await odooClient.findOrCreatePartner({
          name: updatedUser.name || updatedUser.email.split("@")[0] || "Guest",
          email: updatedUser.email,
          phone: updatedUser.phone || undefined,
        });
        console.log(
          `✅ Profile update synced to Odoo for user ${updatedUser.id}`,
        );
      }
    } catch (error) {
      console.error("❌ Failed to sync profile update to Odoo:", error);
      // Non-blocking: profile still updated
    }

    return jsonResponse(
      successResponse(updatedUser, "Profile updated successfully"),
    );
  } catch (error) {
    console.error("Profile update error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update profile";
    const isAuthError =
      error instanceof Error && error.message === "Authentication required";
    return jsonResponse(errorResponse(message), isAuthError ? 401 : 500);
  }
}

/**
 * DELETE /api/auth/profile - Delete user account
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Soft delete: mark as deleted instead of hard delete
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: "deleted",
        email: `deleted_${user.id}@deleted.local`, // Prevent email reuse
        updatedAt: new Date(),
      },
    });

    logAuthEvent(
      AuthEvent.ACCOUNT_DELETED,
      { userId: user.id, email: user.email },
      "info",
    );

    return jsonResponse(successResponse(null, "Account deleted successfully"));
  } catch (error) {
    console.error("Account deletion error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete account";
    const isAuthError =
      error instanceof Error && error.message === "Authentication required";
    return jsonResponse(errorResponse(message), isAuthError ? 401 : 500);
  }
}
