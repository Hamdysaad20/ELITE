import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";
import { logAuthEvent, AuthEvent } from "@/server/auth/logger";
import { z } from "zod";

const UpdateUserSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  status: z.enum(["active", "suspended", "deleted"]).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/users/:id - Get user details (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await requireRole(request, ["admin"]);

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        loyalty: true,
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
        ledger: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!user) {
      return jsonResponse(errorResponse("User not found"), 404);
    }

    return jsonResponse(successResponse(user));
  } catch (error) {
    console.error("Admin user fetch error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch user";
    const isAuthError = error instanceof Error && error.message.includes("required");
    return jsonResponse(errorResponse(message), isAuthError ? 403 : 500);
  }
}

/**
 * PATCH /api/admin/users/:id - Update user (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const admin = await requireRole(request, ["admin"]);
    const body = await request.json();
    const { id } = await params;

    // Validate input
    const validation = UpdateUserSchema.safeParse(body);
    if (!validation.success) {
      return jsonResponse(
        errorResponse("Invalid input", JSON.stringify(validation.error.errors)),
        400,
      );
    }

    const { role, status } = validation.data;

    // Prevent admin from suspending themselves
    if (id === admin.id && status === "suspended") {
      return jsonResponse(
        errorResponse("You cannot suspend your own account"),
        400,
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(role !== undefined && { role }),
        ...(status !== undefined && { status }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    // Log the action
    if (status === "suspended") {
      logAuthEvent(
        AuthEvent.ACCOUNT_SUSPENDED,
        {
          userId: id,
          email: updatedUser.email,
          reason: `Suspended by admin ${admin.id}`,
        },
        "warning",
      );
    } else {
      logAuthEvent(
        AuthEvent.ACCOUNT_UPDATED,
        {
          userId: id,
          email: updatedUser.email,
          metadata: { updatedBy: admin.id, changes: validation.data },
        },
        "info",
      );
    }

    return jsonResponse(
      successResponse(updatedUser, "User updated successfully"),
    );
  } catch (error) {
    console.error("Admin user update error:", error);
    const message = error instanceof Error ? error.message : "Failed to update user";
    const isAuthError = error instanceof Error && error.message.includes("required");
    return jsonResponse(errorResponse(message), isAuthError ? 403 : 500);
  }
}

/**
 * DELETE /api/admin/users/:id - Delete user (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const admin = await requireRole(request, ["admin"]);
    const { id } = await params;

    // Prevent admin from deleting themselves
    if (id === admin.id) {
      return jsonResponse(
        errorResponse("You cannot delete your own account"),
        400,
      );
    }

    // Get user email for logging
    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true },
    });

    if (!user) {
      return jsonResponse(errorResponse("User not found"), 404);
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: {
        status: "deleted",
        email: `deleted_${id}@deleted.local`,
        updatedAt: new Date(),
      },
    });

    logAuthEvent(
      AuthEvent.ACCOUNT_DELETED,
      {
        userId: id,
        email: user.email,
        reason: `Deleted by admin ${admin.id}`,
      },
      "warning",
    );

    return jsonResponse(
      successResponse(null, "User deleted successfully"),
    );
  } catch (error) {
    console.error("Admin user deletion error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete user";
    const isAuthError = error instanceof Error && error.message.includes("required");
    return jsonResponse(errorResponse(message), isAuthError ? 403 : 500);
  }
}

