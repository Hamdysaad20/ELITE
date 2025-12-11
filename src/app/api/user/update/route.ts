import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/server/auth/options";

// PATCH /api/user/update - Update user profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(getAuthOptions());
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { success: false, error: "Name must be less than 100 characters" },
        { status: 400 }
      );
    }

    // Update user name
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update user",
      },
      { status: 500 }
    );
  }
}
