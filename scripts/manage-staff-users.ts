import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Create new barista account for hamdyhamadavlogs266@gmail.com
  const newBarista = await prisma.user.upsert({
    where: { email: "hamdyhamadavlogs266@gmail.com" },
    update: {
      role: "barista",
      status: "active",
    },
    create: {
      email: "hamdyhamadavlogs266@gmail.com",
      name: "Barista",
      role: "barista",
      status: "active",
    },
  });
  console.log(
    `✅ Barista account ready: ${newBarista.email} (role: ${newBarista.role})`,
  );

  // 2. Upgrade Abdalla to head_barista so he can do both bar + storage inventory counts
  const abdalla = await prisma.user.findFirst({
    where: {
      name: { contains: "abdalla", mode: "insensitive" },
      role: "barista",
    },
  });

  if (!abdalla) {
    console.warn(
      "⚠️  Could not find a barista named 'Abdalla'. Trying broader search...",
    );
    const candidates = await prisma.user.findMany({
      where: { name: { contains: "abd", mode: "insensitive" } },
      select: { id: true, name: true, email: true, role: true },
    });
    if (candidates.length === 0) {
      console.error("❌ No user found matching 'abd*'. Check the name in DB.");
    } else {
      console.log("Found candidates — update manually if needed:");
      for (const c of candidates) {
        console.log(`  id=${c.id}  name=${c.name}  email=${c.email}  role=${c.role}`);
      }
    }
    return;
  }

  const updated = await prisma.user.update({
    where: { id: abdalla.id },
    data: { role: "head_barista" },
  });
  console.log(
    `✅ Abdalla upgraded: ${updated.name} (${updated.email}) → role: ${updated.role}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
