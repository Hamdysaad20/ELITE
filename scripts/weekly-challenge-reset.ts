import { PrismaClient } from "@prisma/client";
import { resetRecurringChallenges } from "../src/server/services/challengeService";

const prisma = new PrismaClient();

async function runWeeklyChallengeReset() {
  console.log("🔄 Running weekly challenge reset...");
  console.log(`Date: ${new Date().toISOString()}\n`);

  try {
    await resetRecurringChallenges("weekly");

    const weekStartDate = new Date();
    weekStartDate.setHours(0, 0, 0, 0);

    await prisma.userStreak.updateMany({
      data: {
        weeklyCount: 0,
        weekStartDate,
      },
    });

    console.log("✅ Weekly challenge reset completed successfully!");
  } catch (error) {
    console.error("❌ Weekly challenge reset failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runWeeklyChallengeReset();
