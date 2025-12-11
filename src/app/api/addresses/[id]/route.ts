import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/server/auth/options";
import { createOdooClient } from "@/server/utils/odooClient";

// GET /api/addresses/[id] - Get single address
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(getAuthOptions());
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const address = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: address,
    });
  } catch (error) {
    console.error("Error fetching address:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch address",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/addresses/[id] - Update address
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(getAuthOptions());
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();

    // Verify ownership
    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (body.isDefault === true) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        label: body.label,
        street: body.street,
        apartment: body.apartment,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        country: body.country,
        phone: body.phone,
        notes: body.notes,
        isDefault: body.isDefault,
      },
    });

    // Sync updated address to Odoo
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
        console.log(`✅ Address update synced to Odoo for user ${session.user.id}`);
      }
    } catch (error) {
      console.error("❌ Failed to sync address update to Odoo:", error);
      // Non-blocking: address still updated
    }

    return NextResponse.json({
      success: true,
      data: address,
    });
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update address",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/addresses/[id] - Delete address
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(getAuthOptions());
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Verify ownership
    const address = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    // If deleting default address, set another as default
    if (address.isDefault) {
      const otherAddress = await prisma.address.findFirst({
        where: { userId: session.user.id, id: { not: id } },
      });

      if (otherAddress) {
        await prisma.address.update({
          where: { id: otherAddress.id },
          data: { isDefault: true },
        });
      }
    }

    await prisma.address.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete address",
      },
      { status: 500 }
    );
  }
}
