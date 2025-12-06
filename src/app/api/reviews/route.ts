import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { jsonResponse, successResponse, errorResponse, parseRequestBody } from "@/server/utils/apiHelpers";
import { z } from "zod";

const CreateReviewSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

/**
 * GET /api/reviews - Get reviews for a product
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const status = searchParams.get("status") || "approved";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    if (!productId) {
      return jsonResponse(errorResponse("productId is required"), 400);
    }

    const reviews = await prisma.review.findMany({
      where: {
        productId,
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { helpful: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
    });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0;

    return jsonResponse(
      successResponse({
        reviews: reviews.map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          helpful: r.helpful,
          verified: r.verified,
          createdAt: r.createdAt,
          user: {
            name: r.user.name || "Anonymous",
            // Hide email for privacy
          },
        })),
        stats: {
          total: reviews.length,
          averageRating: Math.round(avgRating * 10) / 10,
        },
      }),
    );
  } catch (error: any) {
    console.error("Reviews fetch error:", error);
    return jsonResponse(errorResponse(error?.message || "Failed to fetch reviews"), 500);
  }
}

/**
 * POST /api/reviews - Create a review
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const raw = await parseRequestBody(request);
    const body = CreateReviewSchema.parse(raw);

    // Check if user already reviewed this product
    const existing = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: body.productId,
        },
      },
    });

    if (existing) {
      return jsonResponse(
        errorResponse("You have already reviewed this product"),
        400,
      );
    }

    // Check if user has ordered this product (for verified badge)
    const hasOrdered = await prisma.orderItem.findFirst({
      where: {
        productId: body.productId,
        order: {
          userId: user.id,
          status: { in: ["CONFIRMED", "DELIVERED", "COMPLETED"] },
        },
      },
    });

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId: body.productId,
        productName: body.productName,
        rating: body.rating,
        comment: body.comment,
        verified: !!hasOrdered,
        status: "approved", // Auto-approve for now; can add moderation later
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return jsonResponse(
      successResponse({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        verified: review.verified,
        createdAt: review.createdAt,
        user: {
          name: review.user.name || "Anonymous",
        },
      }, "Review submitted successfully"),
      201,
    );
  } catch (error: any) {
    console.error("Review creation error:", error);
    
    if (error.name === "ZodError") {
      return jsonResponse(errorResponse("Invalid review data"), 400);
    }
    
    const message = error?.message || "Failed to create review";
    return jsonResponse(errorResponse(message), error?.message === "Authentication required" ? 401 : 500);
  }
}

