import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/server/auth/options";
import { createOdooClient } from "@/server/utils/odooClient";
import { createAddressSchema } from "@/server/validators/addressSchemas";
import { sanitizeObject, sanitizePhone } from "@/lib/sanitization";

// GET /api/addresses - Get all addresses for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(getAuthOptions());

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
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
        error:
          error instanceof Error ? error.message : "Failed to fetch addresses",
      },
      { status: 500 },
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
        { status: 401 },
      );
    }

    const body = await req.json();

    // Validate with Zod schema
    const validationResult = createAddressSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
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
    const {
      label,
      street,
      apartment,
      city,
      state,
      country = "Egypt",
      phone,
      notes,
      isDefault = false,
    } = validatedData;

    // Check for duplicate address (case-insensitive comparison)
    const normalizedStreet = (street as string).trim().toLowerCase();
    const normalizedCity = (city as string).trim().toLowerCase();
    const normalizedApartment =
      (apartment as string | null | undefined)?.trim().toLowerCase() || "";

    // Get all user addresses and check for duplicates
    const userAddresses = await prisma.address.findMany({
      where: { userId: session.user.id },
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

    // Sanitize address data before storing to prevent XSS
    const sanitizedData = sanitizeObject({
      label,
      street,
      apartment,
      city,
      state,
      country,
      notes,
    });

    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        label: sanitizedData.label as string,
        street: sanitizedData.street as string,
        apartment: sanitizedData.apartment as string | null | undefined,
        city: sanitizedData.city as string,
        state: sanitizedData.state as string | null | undefined,
        zipCode: null,
        country: sanitizedData.country as string,
        phone: phone ? sanitizePhone(phone as string) : null,
        notes: sanitizedData.notes as string | null | undefined,
        isDefault: (isDefault as boolean) || addressCount === 0,
      },
    });

    // Sync address to Odoo
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
        error:
          error instanceof Error ? error.message : "Failed to create address",
      },
      { status: 500 },
    );
  }
}
