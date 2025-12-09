import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/server/db/client";

export type AuthUser = {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  status?: string;
};

// Don't check at module load time (build), check at runtime
function getNextAuthSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET must be set in production");
  }
  return secret;
}

/**
 * Get authenticated user from NextAuth JWT token
 * Returns null if no valid session exists
 */
export async function getAuthUser(
  req: NextRequest,
): Promise<AuthUser | null> {
  try {
    const token = await getToken({ req, secret: getNextAuthSecret() });
    
    if (!token || !token.sub) {
      return null;
    }

    // Check if user still exists and is active
    if (token.status === "suspended" || token.status === "deleted") {
      console.warn(`Rejected session for ${token.status} user: ${token.sub}`);
      return null;
    }

    return {
      id: token.sub,
      email: token.email as string | undefined,
      name: token.name as string | undefined,
      role: token.role as string | undefined,
      status: token.status as string | undefined,
    };
  } catch (error) {
    console.error("Failed to get auth user:", error);
    return null;
  }
}

/**
 * Require authenticated user, throw error if not authenticated
 */
export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const user = await getAuthUser(req);
  
  if (!user) {
    throw new Error("Authentication required");
  }
  
  return user;
}

/**
 * Require specific role(s)
 */
export async function requireRole(
  req: NextRequest,
  allowedRoles: string[],
): Promise<AuthUser> {
  const user = await requireAuth(req);
  
  if (!user.role || !allowedRoles.includes(user.role)) {
    throw new Error(`Required role: ${allowedRoles.join(" or ")}`);
  }
  
  return user;
}

/**
 * Check if user has permission (role-based)
 */
export function hasPermission(user: AuthUser | null, requiredRole: string): boolean {
  if (!user || !user.role) return false;
  
  // Admin has all permissions
  if (user.role === "admin") return true;
  
  return user.role === requiredRole;
}

/**
 * Get user with full profile from database
 */
export async function getUserProfile(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        loyalty: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    return user;
  } catch (error) {
    console.error("Failed to get user profile:", error);
    return null;
  }
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  } catch (error) {
    console.error("Failed to update last login:", error);
  }
}

/**
 * Suspend user account
 */
export async function suspendUser(userId: string, reason?: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { status: "suspended" },
    });
    
    console.log(`User ${userId} suspended. Reason: ${reason || "N/A"}`);
    return true;
  } catch (error) {
    console.error("Failed to suspend user:", error);
    return false;
  }
}

/**
 * Reactivate suspended user
 */
export async function reactivateUser(userId: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { status: "active" },
    });
    
    console.log(`User ${userId} reactivated`);
    return true;
  } catch (error) {
    console.error("Failed to reactivate user:", error);
    return false;
  }
}
