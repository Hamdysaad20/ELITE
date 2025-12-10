import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { getAuthUser } from "@/server/auth/session";

// GET /api/addresses - Get all addresses for current user
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [
        { isDefault: "desc" }, // Default address first
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch addresses",
      },
      { status: 500 }
    );
  }
}

// POST /api/addresses - Create new address
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      label,
      street,
      apartment,
      city,
      state,
      zipCode,
      country = "Egypt",
      phone,
      notes,
      isDefault = false,
    } = body;

    // Validation
    if (!label || !street || !city) {
      return NextResponse.json(
        { success: false, error: "Label, street, and city are required" },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If this is the user's first address, make it default
    const addressCount = await prisma.address.count({
      where: { userId: user.id },
    });

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        label,
        street,
        apartment,
        city,
        state,
        zipCode,
        country,
        phone,
        notes,
        isDefault: isDefault || addressCount === 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: address,
    });
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create address",
      },
      { status: 500 }
    );
  }
}
