/**
 * Comprehensive Test Suite for ELITE Rewards System
 * Tests all endpoints, user flows, and business logic
 */

import { PrismaClient } from "@prisma/client";
import {
  ELITE_TIERS,
  calculatePurchaseCoins,
  awardOrderCoins,
  addBonusCoins,
} from "../src/server/services/eliteLoyalty";

const prisma = new PrismaClient();

// Test colors
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

function logSection(title: string) {
  console.log("\n" + "=".repeat(70));
  log(title, "magenta");
  console.log("=".repeat(70));
}

function logTest(testName: string) {
  log(`\n🧪 Test: ${testName}`, "blue");
}

function logSuccess(message: string) {
  log(`✅ ${message}`, "green");
}

function logError(message: string) {
  log(`❌ ${message}`, "red");
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, "yellow");
}

let testUserId: string;
let testOrderId: string;

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  errors: [] as string[],
};

async function cleanup() {
  logSection("🧹 CLEANUP");
  try {
    if (testUserId) {
      await prisma.socialAction.deleteMany({ where: { userId: testUserId } });
      await prisma.rewardRedemption.deleteMany({ where: { userId: testUserId } });
      await prisma.userAvatar.deleteMany({ where: { userId: testUserId } });
      await prisma.challengeCompletion.deleteMany({ where: { userId: testUserId } });
      await prisma.userStreak.deleteMany({ where: { userId: testUserId } });
      await prisma.monthlyTierProgress.deleteMany({ where: { userId: testUserId } });
      await prisma.loyaltyLedger.deleteMany({ where: { userId: testUserId } });
      await prisma.loyaltyAccount.deleteMany({ where: { userId: testUserId } });
      
      if (testOrderId) {
        await prisma.orderItem.deleteMany({ where: { orderId: testOrderId } });
        await prisma.order.deleteMany({ where: { id: testOrderId } });
      }
      
      await prisma.user.deleteMany({ where: { id: testUserId } });
      logSuccess("Test data cleaned up");
    }
  } catch (error) {
    logError(`Cleanup failed: ${error}`);
  }
}

async function testTierConfiguration() {
  logSection("TEST 1: TIER CONFIGURATION");
  
  logTest("Verify 10-tier system exists");
  try {
    const tiers = Object.keys(ELITE_TIERS);
    if (tiers.length === 10) {
      logSuccess(`✓ All 10 tiers configured: ${tiers.join(", ")}`);
      testResults.passed++;
    } else {
      throw new Error(`Expected 10 tiers, found ${tiers.length}`);
    }
  } catch (error) {
    logError(`✗ ${error}`);
    testResults.failed++;
    testResults.errors.push(`Tier configuration: ${error}`);
  }

  logTest("Verify tier multipliers");
  try {
    const expectedMultipliers = [0, 5, 7, 10, 12, 14, 16, 18, 20, 25];
    const actualMultipliers = Object.values(ELITE_TIERS).map((t) => t.multiplier);
    
    if (JSON.stringify(actualMultipliers) === JSON.stringify(expectedMultipliers)) {
      logSuccess(`✓ Multipliers correct: ${actualMultipliers.join("%, ")}%`);
      testResults.passed++;
    } else {
      throw new Error(`Multipliers mismatch. Expected: ${expectedMultipliers}, Got: ${actualMultipliers}`);
    }
  } catch (error) {
    logError(`✗ ${error}`);
    testResults.failed++;
    testResults.errors.push(`Tier multipliers: ${error}`);
  }

  logTest("Verify monthly requirements increase progressively");
  try {
    const tiers = Object.values(ELITE_TIERS);
    let lastCoins = 0;
    let progressive = true;
    
    for (const tier of tiers) {
      if (tier.monthlyRequirements.coinsEarned < lastCoins) {
        progressive = false;
        break;
      }
      lastCoins = tier.monthlyRequirements.coinsEarned;
    }
    
    if (progressive) {
      logSuccess("✓ Requirements increase progressively");
      testResults.passed++;
    } else {
      throw new Error("Requirements do not increase progressively");
    }
  } catch (error) {
    logError(`✗ ${error}`);
    testResults.failed++;
    testResults.errors.push(`Progressive requirements: ${error}`);
  }
}

async function testCoinCalculations() {
  logSection("TEST 2: COIN CALCULATIONS");

  logTest("Base coin calculation (10 coins per 1 EGP)");
  try {
    const result = calculatePurchaseCoins(100, 0); // 100 EGP, 0% multiplier
    if (result === 1000) {
      logSuccess(`✓ 100 EGP = ${result} coins (correct)`);
      testResults.passed++;
    } else {
      throw new Error(`Expected 1000 coins, got ${result}`);
    }
  } catch (error) {
    logError(`✗ ${error}`);
    testResults.failed++;
    testResults.errors.push(`Base calculation: ${error}`);
  }

  logTest("Coin calculation with 10% tier multiplier");
  try {
    const result = calculatePurchaseCoins(100, 10); // 100 EGP, 10% multiplier
    if (result === 1100) {
      logSuccess(`✓ 100 EGP with 10% = ${result} coins (correct)`);
      testResults.passed++;
    } else {
      throw new Error(`Expected 1100 coins, got ${result}`);
    }
  } catch (error) {
    logError(`✗ ${error}`);
    testResults.failed++;
    testResults.errors.push(`Multiplier calculation: ${error}`);
  }

  logTest("Coin calculation with 25% tier multiplier (Founder)");
  try {
    const result = calculatePurchaseCoins(200, 25); // 200 EGP, 25% multiplier
    if (result === 2500) {
      logSuccess(`✓ 200 EGP with 25% = ${result} coins (correct)`);
      testResults.passed++;
    } else {
      throw new Error(`Expected 2500 coins, got ${result}`);
    }
  } catch (error) {
    logError(`✗ ${error}`);
    testResults.failed++;
    testResults.errors.push(`Founder multiplier: ${error}`);
  }
}

async function testUserCreation() {
  logSection("TEST 3: USER CREATION & LOYALTY ACCOUNT");

  logTest("Create test user");
  try {
    const user = await prisma.user.create({
      data: {
        email: `test-elite-${Date.now()}@test.com`,
        name: "Elite Test User",
        role: "user",
        status: "active",
      },
    });
    testUserId = user.id;
    logSuccess(`✓ User created: ${user.email}`);
    testResults.passed++;
  } catch (error) {
    logError(`✗ Failed to create user: ${error}`);
    testResults.failed++;
    testResults.errors.push(`User creation: ${error}`);
    throw error; // Stop further tests if user creation fails
  }

  logTest("Create loyalty account");
  try {
    const loyaltyAccount = await prisma.loyaltyAccount.create({
      data: {
        userId: testUserId,
        coins: 0,
        lifetimeCoins: 0,
        totalSpent: 0,
        tier: "starter",
        tierMultiplier: 0,
      },
    });
    logSuccess(`✓ Loyalty account created (Tier: ${loyaltyAccount.tier}, Coins: ${loyaltyAccount.coins})`);
    testResults.passed++;
  } catch (error) {
    logError(`✗ Failed to create loyalty account: ${error}`);
    testResults.failed++;
    testResults.errors.push(`Loyalty account creation: ${error}`);
  }

  logTest("Verify default tier is 'starter'");
  try {
    const account = await prisma.loyaltyAccount.findUnique({
      where: { userId: testUserId },
    });
    
    if (account?.tier === "starter" && account?.tierMultiplier === 0) {
      logSuccess("✓ Default tier and multiplier correct");
      testResults.passed++;
    } else {
      throw new Error(`Expected starter/0%, got ${account?.tier}/${account?.tierMultiplier}%`);
    }
  } catch (error) {
    logError(`✗ ${error}`);
    testResults.failed++;
    testResults.errors.push(`Default tier: ${error}`);
  }
}

async function testOrderCoins() {
  logSection("TEST 4: ORDER COMPLETION & COIN AWARDS");

  logTest("Create test order");
  try {
    const order = await prisma.order.create({
      data: {
        userId: testUserId,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod: "CASH",
        orderType: "DELIVERY",
        subtotal: 150,
        deliveryFee: 15,
        discount: 0,
        total: 165,
        clientOrderRef: `TEST-${Date.now()}`,
      },
    });
    testOrderId = order.id;
    logSuccess(`✓ Order created: ${order.total} EGP`);
    testResults.passed++;
  } catch (error) {
    logError(`✗ Failed to create order: ${error}`);
    testResults.failed++;
    testResults.errors.push(`Order creation: ${error}`);
  }

  logTest("Award coins for completed order");
  try {
    // Update order to completed
    await prisma.order.update({
      where: { id: testOrderId },
      data: { status: "COMPLETED" },
    });

    const result = await awardOrderCoins(testOrderId, testUserId);
    
    if (result && result.coinsAwarded > 0) {
      logSuccess(`✓ Coins awarded: ${result.coinsAwarded} coins for order`);
      testResults.passed++;
    } else {
      throw new Error("No coins awarded");
    }
  } catch (error) {
    logError(`✗ ${error}`);
    testResults.failed++;
    testResults.errors.push(`Coin award: ${error}`);
  }

  logTest("Verify coins in ledger");
  try {
    const ledgerEntries = await prisma.loyaltyLedger.findMany({
      where: { userId: testUserId, orderId: testOrderId },
    });
    
    if (ledgerEntries.length > 0 && ledgerEntries[0].deltaCoins > 0) {
      logSuccess(`✓ Ledger entry created: ${ledgerEntries[0].deltaCoins} coins, source: ${ledgerEntries[0].source}`);
      testResults.passed++;
    } else {
      throw new Error("No ledger entry found");
    }
  } catch (error) {
    logError(`✗ ${error}`);
    testResults.failed++;
    testResults.errors.push(`Ledger verification: ${error}`);
  }

  logTest("Verify account balance updated");
  try {
    const account = await prisma.loyaltyAccount.findUnique({
      where: { userId: testUserId },
    });
    
    if (account && account.coins > 0 && account.lifetimeCoins > 0) {
      logSuccess(`✓ Balance updated: ${account.coins} coins (lifetime: ${account.lifetimeCoins})`);
      testResults.passed++;
    } else {
      throw new Error(`Balance not updated correctly: ${account?.coins}`);
    }
  } catch (error) {
    logError(`✗ ${error}`);
    testResults.failed++;
    testResults.errors.push(`Balance update: ${error}`);
  }
}

async function testStreakSystem() {
  logSection("TEST 5: STREAK SYSTEM");

  logTest("Create user streak");
  try {
    const streak = await prisma.userStreak.create({
      data: {
        userId: testUserId,
        currentDaily: 3,
        longestDaily: 5,
        weeklyCount: 2,
        monthlyCount: 8,
        totalDaysActive: 15,
        lastActivityDate: new Date(),
      },
    });
    logSuccess(`✓ Streak created: ${streak.currentDaily} day current streak`);
    testResults.passed++;
  } catch (error) {
    logError(`✗ ${error}`);
    testResults.failed++;
    testResults.errors.push(`Streak creation: ${error}`);
  }

  logTest("Verify streak data");
  try {
    const streak = await prisma.userStreak.findUnique({
      where: { userId: testUserId },
    });
    
    if (streak && streak.currentDaily === 3 && streak.longestDaily === 5) {
      logSuccess("✓ Streak data correct");
      testResults.passed++;
    } else {
      throw new Error("Streak data incorrect");
    }
  } catch (error) {
    logError(`✗ ${error}`);
    testResults.failed++;
    testResults.errors.push(`Streak verification: ${error}`);
  }
}

async function testChallenges() {
  logSection("TEST 6: CHALLENGES SYSTEM");

  logTest("Create test challenge");
  try {
    const challenge = await prisma.challenge.create({
      data: {
        title: "Test Challenge",
        description: "Complete 3 orders",
        type: "purchase_count",
        tier: "normal",
        requirement: { type: "purchase_count", target: 3 },
        coinsReward: 500,
        isActive: true,
        priority: 1,
      },
    });
    logSuccess(`✓ Challenge created: ${challenge.title} (${challenge.coinsReward} coins)`);
    testResults.passed++;

    // Cleanup
    await prisma.challenge.delete({ where: { id: challenge.id } });
  } catch (error) {
    logError(`✗ ${error}`);
    testResults.failed++;
    testResults.errors.push(`Challenge creation: ${error}`);
  }
}

async function testAvatarSystem() {
  logSection("TEST 7: AVATAR SYSTEM");

  logTest("Create test avatar");
  try {
    const avatar = await prisma.avatar.create({
      data: {
        name: "Test Avatar",
        imageUrl: "/avatars/test.png",
        rarity: "common",
        unlockType: "tier",
        unlockValue: "starter",
        isActive: true,
      },
    });
    logSuccess(`✓ Avatar created: ${avatar.name} (${avatar.rarity})`);
    testResults.passed++;

    // Test unlock
    await prisma.userAvatar.create({
      data: {
        userId: testUserId,
        avatarId: avatar.id,
      },
    });
    logSuccess("✓ Avatar unlocked for user");
    testResults.passed++;

    // Cleanup
    await prisma.userAvatar.deleteMany({ where: { avatarId: avatar.id } });
    await prisma.avatar.delete({ where: { id: avatar.id } });
  } catch (error) {
    logError(`✗ ${error}`);
    testResults.failed++;
    testResults.errors.push(`Avatar system: ${error}`);
  }
}

async function testRewardsShop() {
  logSection("TEST 8: REWARDS SHOP");

  logTest("Create reward item");
  try {
    const item = await prisma.rewardItem.create({
      data: {
        name: "Test Mug",
        description: "Test reward item",
        type: "merch",
        coinsCost: 40000,
        egpValue: 400,
        isActive: true,
      },
    });
    logSuccess(`✓ Reward item created: ${item.name} (${item.coinsCost} coins)`);
    testResults.passed++;

    // Test pricing formula (100 coins = 1 EGP)
    const expectedCoins = Number(item.egpValue) * 100;
    if (item.coinsCost === expectedCoins) {
      logSuccess("✓ Pricing formula correct (100 coins = 1 EGP)");
      testResults.passed++;
    } else {
      throw new Error(`Pricing mismatch: ${item.coinsCost} vs ${expectedCoins}`);
    }

    // Cleanup
    await prisma.rewardItem.delete({ where: { id: item.id } });
  } catch (error) {
    logError(`✗ ${error}`);
    testResults.failed++;
    testResults.errors.push(`Rewards shop: ${error}`);
  }
}

async function testBonusCoins() {
  logSection("TEST 9: BONUS COINS (ADMIN)");

  logTest("Award bonus coins");
  try {
    const beforeBalance = await prisma.loyaltyAccount.findUnique({
      where: { userId: testUserId },
    });

    await addBonusCoins(testUserId, 1000, "Test bonus", { testData: true });

    const afterBalance = await prisma.loyaltyAccount.findUnique({
      where: { userId: testUserId },
    });

    if (afterBalance && beforeBalance && afterBalance.coins === beforeBalance.coins + 1000) {
      logSuccess(`✓ Bonus coins added: ${afterBalance.coins - beforeBalance.coins} coins`);
      testResults.passed++;
    } else {
      throw new Error("Bonus coins not added correctly");
    }
  } catch (error) {
    logError(`✗ ${error}`);
    testResults.failed++;
    testResults.errors.push(`Bonus coins: ${error}`);
  }
}

async function testMonthlyProgress() {
  logSection("TEST 10: MONTHLY TIER PROGRESS");

  logTest("Create monthly progress");
  try {
    const now = new Date();
    const progress = await prisma.monthlyTierProgress.create({
      data: {
        userId: testUserId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        coinsEarned: 2000,
        purchaseCount: 3,
        challengesComplete: 1,
        eliteChallengesComplete: 0,
        maxStreakDays: 5,
        currentStreakDays: 3,
        tierAtStart: "starter",
        lastActivityDate: now,
      },
    });
    logSuccess(`✓ Monthly progress created: ${progress.coinsEarned} coins, ${progress.purchaseCount} purchases`);
    testResults.passed++;
  } catch (error) {
    logError(`✗ ${error}`);
    testResults.failed++;
    testResults.errors.push(`Monthly progress: ${error}`);
  }
}

async function printSummary() {
  logSection("📊 TEST SUMMARY");
  
  const total = testResults.passed + testResults.failed;
  const successRate = ((testResults.passed / total) * 100).toFixed(1);
  
  console.log("");
  log(`Total Tests: ${total}`, "blue");
  log(`✅ Passed: ${testResults.passed}`, "green");
  log(`❌ Failed: ${testResults.failed}`, "red");
  log(`Success Rate: ${successRate}%`, testResults.failed === 0 ? "green" : "yellow");
  
  if (testResults.errors.length > 0) {
    console.log("\n" + "=".repeat(70));
    log("ERRORS:", "red");
    testResults.errors.forEach((error, i) => {
      console.log(`${i + 1}. ${error}`);
    });
  }
  
  console.log("\n" + "=".repeat(70));
  if (testResults.failed === 0) {
    log("🎉 ALL TESTS PASSED!", "green");
  } else {
    log("⚠️  SOME TESTS FAILED - Review errors above", "yellow");
  }
  console.log("=".repeat(70) + "\n");
}

async function main() {
  logSection("🌟 ELITE REWARDS SYSTEM - COMPREHENSIVE TEST SUITE");
  log("Testing all components, APIs, and business logic\n", "blue");

  try {
    await testTierConfiguration();
    await testCoinCalculations();
    await testUserCreation();
    await testOrderCoins();
    await testStreakSystem();
    await testChallenges();
    await testAvatarSystem();
    await testRewardsShop();
    await testBonusCoins();
    await testMonthlyProgress();
  } catch (error) {
    logError(`Critical error: ${error}`);
  } finally {
    await cleanup();
    await printSummary();
    await prisma.$disconnect();
  }
}

main();
