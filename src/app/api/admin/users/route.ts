import { NextRequest } from "next/server";
import { requireRole } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";

/**
 * GET /api/admin/users - List all users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              orders: true,
            },
          },
          loyalty: {
            select: {
              points: true,
              totalSpent: true,
              level: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return jsonResponse(
      successResponse({
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }),
    );
  } catch (error: any) {
    console.error("Admin users list error:", error);
    const message = error?.message || "Failed to fetch users";
    const status = error?.message?.includes("required") ? 403 : 500;
    return jsonResponse(errorResponse(message), status);
  }
}

