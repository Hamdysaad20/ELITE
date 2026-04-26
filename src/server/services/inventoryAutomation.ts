import { prisma } from "@/server/db/client";

const SYSTEM_EMAIL = "inventory-system@elite.local";

export async function getInventoryAutomationUserId(): Promise<string | null> {
  if (process.env.INVENTORY_SYSTEM_USER_ID) {
    return process.env.INVENTORY_SYSTEM_USER_ID;
  }

  const existingStaff = await prisma.user.findFirst({
    where: {
      role: { in: ["admin", "manager", "head_barista"] },
      status: { not: "suspended" },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (existingStaff) return existingStaff.id;

  const systemUser = await prisma.user.upsert({
    where: { email: SYSTEM_EMAIL },
    update: {},
    create: {
      email: SYSTEM_EMAIL,
      name: "Inventory Automation",
      role: "admin",
      status: "active",
    },
    select: { id: true },
  });

  return systemUser.id;
}
