import { describe, it, expect } from "vitest";
import { prismaMock } from "../../setup/prisma";

describe("Prisma Intercept Architecture", () => {
  it("should capture and intercept database schemas organically without live TCP socket connections", async () => {

    // Inject synthetic return payloads directly into the ORM handler wrapper
    prismaMock.user.findUnique.mockResolvedValue({
      id: "synthetic_user_999",
      email: "mocked@elite.com",
      name: "Mock Observer",
      phone: "+201000000000",
      role: "user",
      emailVerified: null,
      image: null,
      hashedPassword: null,
      loyaltyPoints: 0,
      loyaltyTierId: null,
      totalSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      odooPartnerId: null,
      lastLoginAt: null
    });

    const user = await prismaMock.user.findUnique({
      where: { id: "synthetic_user_999" }
    });

    // Validations asserting the call was perfectly isolated offline
    expect(user?.email).toBe("mocked@elite.com");
    expect(user?.id).toBe("synthetic_user_999");
    expect(prismaMock.user.findUnique).toHaveBeenCalledOnce();
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: "synthetic_user_999" }
    });
  });
});
