import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/server/auth/options";
import { createOdooClient } from "@/server/utils/odooClient";

// GET /api/addresses - Get all addresses for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(getAuthOptions());
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
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
    const session = await getServerSession(getAuthOptions());
    
    if (!session?.user?.id) {
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
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If this is the user's first address, make it default
    const addressCount = await prisma.address.count({
      where: { userId: session.user.id },
    });

    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
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

    // Sync address to Odoo
    try {
      const odooClient = createOdooClient();
      if (odooClient && session.user.email) {
        await odooClient.findOrCreatePartner({
          name: session.user.name || session.user.email.split('@')[0] || 'Guest',
          email: session.user.email,
          phone: address.phone || undefined,
          street: `${address.street}${address.apartment ? ', ' + address.apartment : ''}`,
          city: address.city,
          zip: address.zipCode || undefined,
        });
        console.log(`✅ Address synced to Odoo for user ${session.user.id}`);
      }
    } catch (error) {
      console.error("❌ Failed to sync address to Odoo:", error);
      // Non-blocking: address still created
    }

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
