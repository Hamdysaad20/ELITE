import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Seeding checkout configuration...");

  const config = await prisma.checkoutConfig.upsert({
    where: { id: "checkout" },
    update: {},
    create: {
      id: "checkout",
      enabledPaymentMethods: ["CASH"],
      deliveryFee: 15,
      codFee: 5,
    },
  });

  console.log("✅ Checkout configuration seeded:", config);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding checkout config:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
