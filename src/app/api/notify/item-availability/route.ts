import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { prisma } from "@/server/db/client";

/**
 * POST /api/notify/item-availability
 * Register user's intent to be notified when ordering resumes for items in their cart
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Read productIds from request body
    let body: { productIds?: string[] } = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { productIds } = body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: "No items to register for notification" },
        { status: 400 }
      );
    }

    // Create notifications (skip duplicates)
    const result = await prisma.itemAvailabilityNotification.createMany({
      data: productIds.map((productId: string) => ({
        userId: session.user.id,
        productId: String(productId),
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      created: result.count,
    });
  } catch (error) {
    console.error("[notify/item-availability] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
