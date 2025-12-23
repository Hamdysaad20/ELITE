/**
 * Seed Gamification Data
 * 
 * Creates initial achievements and badges for the gamification system
 * 
 * Run: npx tsx scripts/seed-gamification.ts
 */

import { config } from "dotenv";
import { prisma } from "@/server/db/client";

config();

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function seedAchievements() {
  log("\n🌱 Seeding Achievements...", "magenta");

  const achievements = [
    {
      code: "deal_purchases",
      name: "Deal Hunter",
      description: "Purchase 10 deals",
      category: "deal",
      tier: "bronze",
      requirementType: "count",
      requirementValue: 10,
      icon: "🎯",
      rewards: [
        {
          rewardType: "points",
          rewardValue: { points: 500 },
          rewardName: "500 Bonus Points",
          priority: 1,
        },
      ],
    },
    {
      code: "monday_morning_deals",
      name: "Morning Legend",
      description: "Purchase 5 Monday Morning Deals",
      category: "deal",
      tier: "silver",
      requirementType: "count",
      requirementValue: 5,
      icon: "☕",
      rewards: [
        {
          rewardType: "points",
          rewardValue: { points: 500 },
          rewardName: "500 Bonus Points",
          priority: 1,
        },
        {
          rewardType: "badge",
          rewardValue: { badgeCode: "morning-legend" },
          rewardName: "Morning Legend Badge",
          priority: 2,
        },
        {
          rewardType: "discount",
          rewardValue: { percentage: 5, category: "Coffee", permanent: true },
          rewardName: "Permanent 5% off Coffee",
          priority: 3,
        },
      ],
    },
    {
      code: "combo_purchases",
      name: "Combo Master",
      description: "Purchase 10 combo deals",
      category: "deal",
      tier: "gold",
      requirementType: "count",
      requirementValue: 10,
      icon: "🍽️",
      rewards: [
        {
          rewardType: "points",
          rewardValue: { points: 1000 },
          rewardName: "1000 Bonus Points",
          priority: 1,
        },
        {
          rewardType: "badge",
          rewardValue: { badgeCode: "combo-master" },
          rewardName: "Combo Master Badge",
          priority: 2,
        },
      ],
    },
    {
      code: "streak_7_days",
      name: "Week Warrior",
      description: "Maintain a 7-day deal purchase streak",
      category: "streak",
      tier: "silver",
      requirementType: "streak",
      requirementValue: 7,
      icon: "🔥",
      rewards: [
        {
          rewardType: "points",
          rewardValue: { points: 300 },
          rewardName: "300 Bonus Points",
          priority: 1,
        },
        {
          rewardType: "badge",
          rewardValue: { badgeCode: "week-warrior" },
          rewardName: "Week Warrior Badge",
          priority: 2,
        },
      ],
    },
    {
      code: "streak_30_days",
      name: "Monthly Champion",
      description: "Maintain a 30-day deal purchase streak",
      category: "streak",
      tier: "platinum",
      requirementType: "streak",
      requirementValue: 30,
      icon: "👑",
      rewards: [
        {
          rewardType: "points",
          rewardValue: { points: 2000 },
          rewardName: "2000 Bonus Points",
          priority: 1,
        },
        {
          rewardType: "badge",
          rewardValue: { badgeCode: "monthly-champion" },
          rewardName: "Monthly Champion Badge",
          priority: 2,
        },
      ],
    },
  ];

  for (const achievementData of achievements) {
    const { rewards, ...achievementFields } = achievementData;

    // Check if achievement exists
    const existing = await prisma.achievement.findUnique({
      where: { code: achievementData.code },
    });

    if (existing) {
      log(`  ⏭️  Achievement already exists: ${achievementData.code}`, "yellow");
      continue;
    }

    // Create achievement
    const achievement = await prisma.achievement.create({
      data: achievementFields,
    });

    log(`  ✅ Created achievement: ${achievement.name}`, "green");

    // Create rewards
    for (const rewardData of rewards) {
      await prisma.achievementReward.create({
        data: {
          achievementId: achievement.id,
          ...rewardData,
        },
      });
    }

    log(`    ✅ Created ${rewards.length} reward(s)`, "blue");
  }
}

async function seedBadges() {
  log("\n🏅 Seeding Badges...", "magenta");

  const badges = [
    {
      code: "morning-legend",
      name: "Morning Legend",
      description: "Unlocked by completing 5 Monday Morning Deals",
      icon: "☕",
      category: "deal",
      rarity: "rare",
      unlockType: "achievement",
      unlockData: { achievementCode: "monday_morning_deals" },
    },
    {
      code: "combo-master",
      name: "Combo Master",
      description: "Unlocked by purchasing 10 combo deals",
      icon: "🍽️",
      category: "deal",
      rarity: "epic",
      unlockType: "achievement",
      unlockData: { achievementCode: "combo_purchases" },
    },
    {
      code: "week-warrior",
      name: "Week Warrior",
      description: "Unlocked by maintaining a 7-day streak",
      icon: "🔥",
      category: "streak",
      rarity: "rare",
      unlockType: "achievement",
      unlockData: { achievementCode: "streak_7_days" },
    },
    {
      code: "monthly-champion",
      name: "Monthly Champion",
      description: "Unlocked by maintaining a 30-day streak",
      icon: "👑",
      category: "streak",
      rarity: "legendary",
      unlockType: "achievement",
      unlockData: { achievementCode: "streak_30_days" },
    },
  ];

  for (const badgeData of badges) {
    const existing = await prisma.badge.findUnique({
      where: { code: badgeData.code },
    });

    if (existing) {
      log(`  ⏭️  Badge already exists: ${badgeData.code}`, "yellow");
      continue;
    }

    await prisma.badge.create({
      data: badgeData,
    });

    log(`  ✅ Created badge: ${badgeData.name}`, "green");
  }
}

async function main() {
  try {
    log("🎮 GAMIFICATION SEED SCRIPT", "magenta");
    log("=" .repeat(60), "magenta");

    await seedAchievements();
    await seedBadges();

    log("\n✅ Seeding complete!", "green");
  } catch (error) {
    log(`\n❌ Error: ${error}`, "red");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

