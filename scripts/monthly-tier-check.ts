import { PrismaClient } from "@prisma/client";
import { checkAndUpdateTier } from "../src/server/services/eliteLoyalty";
import { resetRecurringChallenges } from "../src/server/services/challengeService";

const prisma = new PrismaClient();

async function runMonthlyTierCheck() {
  console.log("🔄 Running monthly tier check and reset...");
  console.log(`Date: ${new Date().toISOString()}\n`);

  try {
    const users = await prisma.user.findMany({
      where: {
        status: "active",
      },
      select: {
        id: true,
        email: true,
      },
    });

    console.log(`Found ${users.length} active users to process\n`);

    let upgraded = 0;
    let downgraded = 0;
    let maintained = 0;
    let errors = 0;

    for (const user of users) {
      try {
        const loyalty = await prisma.loyaltyAccount.findUnique({
          where: { userId: user.id },
        });

        const oldTier = loyalty?.tier || "starter";

        const newTier = await checkAndUpdateTier(user.id);

        if (newTier > oldTier) {
          upgraded++;
          console.log(`⬆️  ${user.email}: ${oldTier} → ${newTier}`);
        } else if (newTier < oldTier) {
          downgraded++;
          console.log(`⬇️  ${user.email}: ${oldTier} → ${newTier}`);
        } else {
          maintained++;
        }

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        await prisma.monthlyTierProgress.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            month,
            year,
            coinsEarned: 0,
            purchaseCount: 0,
            challengesComplete: 0,
            eliteChallengesComplete: 0,
            maxStreakDays: 0,
            currentStreakDays: 0,
            tierAtStart: newTier,
            lastActivityDate: now,
          },
          update: {
            month,
            year,
            coinsEarned: 0,
            purchaseCount: 0,
            challengesComplete: 0,
            eliteChallengesComplete: 0,
            maxStreakDays: 0,
            currentStreakDays: 0,
            tierAtStart: newTier,
            lastActivityDate: now,
          },
        });
      } catch (error) {
        errors++;
        console.error(`❌ Error processing user ${user.email}:`, error);
      }
    }

    await resetRecurringChallenges("monthly");

    console.log("\n📊 Monthly Tier Check Summary:");
    console.log(`   Total Users: ${users.length}`);
    console.log(`   ⬆️  Upgraded: ${upgraded}`);
    console.log(`   ⬇️  Downgraded: ${downgraded}`);
    console.log(`   ➡️  Maintained: ${maintained}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log("\n✅ Monthly tier check completed successfully!");
  } catch (error) {
    console.error("❌ Monthly tier check failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMonthlyTierCheck();
