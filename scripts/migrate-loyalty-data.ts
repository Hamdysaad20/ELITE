import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TIER_MAP: Record<string, string> = {
  bronze: "starter",
  silver: "black",
  gold: "silver",
  platinum: "gold",
};

const MULTIPLIER_MAP: Record<string, number> = {
  bronze: 0,
  silver: 5,
  gold: 7,
  platinum: 10,
};

async function migrateLoyaltyAccounts() {
  console.log("🔄 Migrating loyalty accounts...");

  const accounts = await prisma.loyaltyAccount.findMany();

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const account of accounts) {
    try {
      const oldPoints = account.points || 0;
      const oldLevel = account.level || "bronze";

      const newCoins = oldPoints * 100;
      const newTier = TIER_MAP[oldLevel] || "starter";
      const newMultiplier = MULTIPLIER_MAP[oldLevel] || 0;

      await prisma.loyaltyAccount.update({
        where: { userId: account.userId },
        data: {
          coins: newCoins,
          lifetimeCoins: newCoins,
          tier: newTier,
          tierMultiplier: newMultiplier,
        },
      });

      console.log(
        `✅ ${account.userId}: ${oldPoints} pts (${oldLevel}) → ${newCoins} coins (${newTier})`,
      );
      migrated++;
    } catch (error) {
      console.error(`❌ Error migrating account ${account.userId}:`, error);
      errors++;
    }
  }

  console.log(`\n📊 Accounts Migration Summary:`);
  console.log(`   ✅ Migrated: ${migrated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}\n`);
}

async function migrateLoyaltyLedger() {
  console.log("🔄 Migrating loyalty ledger...");

  const ledgerEntries = await prisma.loyaltyLedger.findMany();

  let migrated = 0;
  let errors = 0;

  for (const entry of ledgerEntries) {
    try {
      const oldDelta = entry.deltaPoints || 0;
      const newDelta = oldDelta * 100;

      await prisma.loyaltyLedger.update({
        where: { id: entry.id },
        data: {
          deltaCoins: newDelta,
          source: entry.orderId ? "order" : "admin",
        },
      });

      migrated++;
    } catch (error) {
      console.error(`❌ Error migrating ledger entry ${entry.id}:`, error);
      errors++;
    }
  }

  console.log(`📊 Ledger Migration Summary:`);
  console.log(`   ✅ Migrated: ${migrated}`);
  console.log(`   ❌ Errors: ${errors}\n`);
}

async function initializeMonthlyProgress() {
  console.log("🔄 Initializing monthly progress records...");

  const users = await prisma.loyaltyAccount.findMany({
    select: {
      userId: true,
      tier: true,
    },
  });

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let created = 0;
  let errors = 0;

  for (const user of users) {
    try {
      const existing = await prisma.monthlyTierProgress.findUnique({
        where: { userId: user.userId },
      });

      if (!existing) {
        await prisma.monthlyTierProgress.create({
          data: {
            userId: user.userId,
            month,
            year,
            coinsEarned: 0,
            purchaseCount: 0,
            challengesComplete: 0,
            eliteChallengesComplete: 0,
            maxStreakDays: 0,
            currentStreakDays: 0,
            tierAtStart: user.tier,
            lastActivityDate: now,
          },
        });
        created++;
      }
    } catch (error) {
      console.error(`❌ Error creating progress for ${user.userId}:`, error);
      errors++;
    }
  }

  console.log(`📊 Monthly Progress Summary:`);
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ❌ Errors: ${errors}\n`);
}

async function initializeStreaks() {
  console.log("🔄 Initializing streak records...");

  const users = await prisma.user.findMany({
    where: {
      status: "active",
    },
    select: {
      id: true,
    },
  });

  let created = 0;
  let errors = 0;

  for (const user of users) {
    try {
      const existing = await prisma.userStreak.findUnique({
        where: { userId: user.id },
      });

      if (!existing) {
        await prisma.userStreak.create({
          data: {
            userId: user.id,
            currentDaily: 0,
            longestDaily: 0,
            weeklyCount: 0,
            monthlyCount: 0,
            totalDaysActive: 0,
          },
        });
        created++;
      }
    } catch (error) {
      console.error(`❌ Error creating streak for ${user.id}:`, error);
      errors++;
    }
  }

  console.log(`📊 Streaks Summary:`);
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ❌ Errors: ${errors}\n`);
}

async function grantWelcomeBonus() {
  console.log("🎁 Granting welcome bonus to existing users...");

  const accounts = await prisma.loyaltyAccount.findMany();
  const WELCOME_BONUS = 1000;

  let granted = 0;
  let errors = 0;

  for (const account of accounts) {
    try {
      await prisma.loyaltyLedger.create({
        data: {
          userId: account.userId,
          deltaCoins: WELCOME_BONUS,
          reason: "Welcome to the new ELITE Rewards System!",
          source: "admin",
          metadata: { type: "migration_bonus" },
        },
      });

      await prisma.loyaltyAccount.update({
        where: { userId: account.userId },
        data: {
          coins: { increment: WELCOME_BONUS },
          lifetimeCoins: { increment: WELCOME_BONUS },
        },
      });

      granted++;
    } catch (error) {
      console.error(`❌ Error granting bonus to ${account.userId}:`, error);
      errors++;
    }
  }

  console.log(`📊 Welcome Bonus Summary:`);
  console.log(`   ✅ Granted: ${granted} users × ${WELCOME_BONUS} coins`);
  console.log(`   ❌ Errors: ${errors}\n`);
}

async function verifyMigration() {
  console.log("🔍 Verifying migration...");

  const accounts = await prisma.loyaltyAccount.findMany();
  const ledgerEntries = await prisma.loyaltyLedger.findMany();
  const progressRecords = await prisma.monthlyTierProgress.findMany();
  const streaks = await prisma.userStreak.findMany();

  console.log(`📊 Post-Migration Status:`);
  console.log(`   Loyalty Accounts: ${accounts.length}`);
  console.log(`   Ledger Entries: ${ledgerEntries.length}`);
  console.log(`   Monthly Progress Records: ${progressRecords.length}`);
  console.log(`   Streak Records: ${streaks.length}`);

  const negativeBalances = accounts.filter((a) => a.coins < 0).length;
  const invalidTiers = accounts.filter((a) => !["starter", "black", "silver", "gold", "platinum", "diamond", "ruby", "obsidian", "eliteBlack", "founder"].includes(a.tier)).length;

  if (negativeBalances > 0) {
    console.warn(`⚠️  Warning: ${negativeBalances} accounts with negative balances`);
  }

  if (invalidTiers > 0) {
    console.warn(`⚠️  Warning: ${invalidTiers} accounts with invalid tiers`);
  }

  if (negativeBalances === 0 && invalidTiers === 0) {
    console.log(`✅ All checks passed!\n`);
  }
}

async function main() {
  console.log("🌟 Starting ELITE Rewards System Migration\n");
  console.log(`Date: ${new Date().toISOString()}\n`);

  try {
    console.log("⚠️  WARNING: This will modify your database!");
    console.log("⚠️  Make sure you have a backup before proceeding.\n");

    await migrateLoyaltyAccounts();
    await migrateLoyaltyLedger();
    await initializeMonthlyProgress();
    await initializeStreaks();
    await grantWelcomeBonus();
    await verifyMigration();

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
