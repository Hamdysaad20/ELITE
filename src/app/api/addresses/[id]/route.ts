import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/server/auth/options";
import { createOdooClient } from "@/server/utils/odooClient";
import { updateAddressSchema } from "@/server/validators/addressSchemas";
import { sanitizeInput, sanitizePhone } from "@/lib/sanitization";
import type { ZodIssue } from "zod";

// GET /api/addresses/[id] - Get single address
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(getAuthOptions());

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const address = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 },
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
        error:
          error instanceof Error ? error.message : "Failed to fetch address",
      },
      { status: 500 },
    );
  }
}

// PATCH /api/addresses/[id] - Update address
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(getAuthOptions());

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
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
        { status: 404 },
      );
    }

    // Validate with Zod schema
    const validationResult = updateAddressSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err: ZodIssue) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errors,
        },
        { status: 400 },
      );
    }

    const validatedData = validationResult.data;

    // Check for duplicate address (excluding current address, case-insensitive)
    if (validatedData.street && validatedData.city) {
      const normalizedStreet = validatedData.street.trim().toLowerCase();
      const normalizedCity = validatedData.city.trim().toLowerCase();
      const normalizedApartment = (validatedData.apartment || "")
        .trim()
        .toLowerCase();

      // Get all user addresses except current one
      const userAddresses = await prisma.address.findMany({
        where: {
          userId: session.user.id,
          id: { not: id },
        },
      });

      const isDuplicate = userAddresses.some((addr) => {
        const addrStreet = (addr.street || "").trim().toLowerCase();
        const addrCity = (addr.city || "").trim().toLowerCase();
        const addrApartment = (addr.apartment || "").trim().toLowerCase();

        return (
          addrStreet === normalizedStreet &&
          addrCity === normalizedCity &&
          addrApartment === normalizedApartment
        );
      });

      if (isDuplicate) {
        return NextResponse.json(
          {
            success: false,
            error: "This address already exists in your address book",
          },
          { status: 400 },
        );
      }
    }

    // If setting as default, unset other defaults
    if (body.isDefault === true) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    // Merge validated data with existing address (only update provided fields)
    // Sanitize all string inputs to prevent XSS
    const updateData: Record<string, unknown> = {};
    if (validatedData.label !== undefined)
      updateData.label = sanitizeInput(validatedData.label);
    if (validatedData.street !== undefined)
      updateData.street = sanitizeInput(validatedData.street);
    if (validatedData.apartment !== undefined)
      updateData.apartment = validatedData.apartment
        ? sanitizeInput(validatedData.apartment)
        : null;
    if (validatedData.city !== undefined)
      updateData.city = sanitizeInput(validatedData.city);
    if (validatedData.state !== undefined)
      updateData.state = validatedData.state
        ? sanitizeInput(validatedData.state)
        : null;
    if (validatedData.zipCode !== undefined)
      updateData.zipCode = validatedData.zipCode
        ? sanitizeInput(validatedData.zipCode)
        : null;
    if (validatedData.country !== undefined)
      updateData.country = sanitizeInput(validatedData.country);
    if (validatedData.phone !== undefined)
      updateData.phone = validatedData.phone
        ? sanitizePhone(validatedData.phone)
        : null;
    if (validatedData.notes !== undefined)
      updateData.notes = validatedData.notes
        ? sanitizeInput(validatedData.notes)
        : null;
    if (validatedData.isDefault !== undefined)
      updateData.isDefault = validatedData.isDefault;

    const address = await prisma.address.update({
      where: { id },
      data: updateData,
    });

    // Sync updated address to Odoo
    try {
      const odooClient = createOdooClient();
      if (odooClient && session.user.email) {
        await odooClient.findOrCreatePartner({
          name:
            session.user.name || session.user.email.split("@")[0] || "Guest",
          email: session.user.email,
          phone: address.phone || undefined,
          street: `${address.street}${address.apartment ? ", " + address.apartment : ""}`,
          city: address.city,
          zip: address.zipCode || undefined,
        });
        console.log(
          `✅ Address update synced to Odoo for user ${session.user.id}`,
        );
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
        error:
          error instanceof Error ? error.message : "Failed to update address",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/addresses/[id] - Delete address
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(getAuthOptions());

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
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
        { status: 404 },
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
        error:
          error instanceof Error ? error.message : "Failed to delete address",
      },
      { status: 500 },
    );
  }
}
