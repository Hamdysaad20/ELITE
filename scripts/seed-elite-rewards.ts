import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedChallenges() {
  console.log("🎯 Seeding Challenges...");

  const challenges = [
    {
      title: "First Steps",
      description: "Complete your first order to earn bonus coins",
      type: "purchase_count",
      tier: "normal",
      requirement: { type: "purchase_count", target: 1 },
      coinsReward: 200,
      priority: 100,
      isActive: true,
    },
    {
      title: "Getting Started",
      description: "Place 3 orders this month",
      type: "purchase_count",
      tier: "normal",
      requirement: { type: "purchase_count", target: 3 },
      coinsReward: 500,
      priority: 90,
      isActive: true,
    },
    {
      title: "Big Spender",
      description: "Spend 500 EGP this month",
      type: "spend_amount",
      tier: "normal",
      requirement: { type: "spend_amount", target: 500 },
      coinsReward: 800,
      priority: 80,
      isActive: true,
    },
    {
      title: "Explorer",
      description: "Order from 3 different categories",
      type: "product_category",
      tier: "normal",
      requirement: { type: "product_category", categoryIds: [], target: 3 },
      coinsReward: 600,
      priority: 70,
      isActive: true,
    },
    {
      title: "Social Butterfly",
      description: "Write 3 product reviews",
      type: "review",
      tier: "normal",
      requirement: { type: "review", target: 3 },
      coinsReward: 400,
      priority: 60,
      isActive: true,
    },
    {
      title: "Streak Master",
      description: "Maintain a 7-day ordering streak",
      type: "streak",
      tier: "normal",
      requirement: { type: "streak", days: 7 },
      coinsReward: 1000,
      priority: 85,
      isActive: true,
    },
    {
      title: "Weekend Warrior",
      description: "Order 3 times on weekends this month",
      type: "purchase_count",
      tier: "normal",
      requirement: { type: "purchase_count", target: 3, conditions: { weekend: true } },
      coinsReward: 700,
      isRecurring: true,
      recurringPeriod: "monthly",
      priority: 65,
      isActive: true,
    },
    {
      title: "Elite Achiever",
      description: "Spend 2000 EGP and complete 5 challenges this month",
      type: "combo",
      tier: "elite",
      requirement: {
        type: "combo",
        conditions: { spendAmount: 2000, challenges: 5 },
      },
      coinsReward: 3000,
      priority: 95,
      isActive: true,
    },
    {
      title: "Power User",
      description: "Place 15 orders in a single month",
      type: "purchase_count",
      tier: "elite",
      requirement: { type: "purchase_count", target: 15 },
      coinsReward: 2500,
      isRecurring: true,
      recurringPeriod: "monthly",
      priority: 88,
      isActive: true,
    },
    {
      title: "Brand Ambassador",
      description: "Refer 5 friends who complete their first order",
      type: "referral",
      tier: "elite",
      requirement: { type: "referral", target: 5 },
      coinsReward: 5000,
      priority: 92,
      isActive: true,
    },
  ];

  for (const challenge of challenges) {
    await prisma.challenge.upsert({
      where: { id: `challenge-${challenge.title.toLowerCase().replace(/\s+/g, "-")}` },
      update: challenge,
      create: {
        id: `challenge-${challenge.title.toLowerCase().replace(/\s+/g, "-")}`,
        ...challenge,
      },
    });
  }

  console.log(`✅ Seeded ${challenges.length} challenges`);
}

async function seedAvatars() {
  console.log("✨ Seeding Avatars...");

  const avatars = [
    {
      name: "Starter",
      imageUrl: "/avatars/starter.png",
      rarity: "common",
      unlockType: "tier",
      unlockValue: "starter",
      description: "Default starter avatar",
      sortOrder: 1,
      isActive: true,
    },
    {
      name: "Coffee Lover",
      imageUrl: "/avatars/coffee-lover.png",
      rarity: "common",
      unlockType: "coins",
      unlockValue: "500",
      description: "For the coffee enthusiasts",
      sortOrder: 10,
      isActive: true,
    },
    {
      name: "Black Card",
      imageUrl: "/avatars/black-card.png",
      rarity: "rare",
      unlockType: "tier",
      unlockValue: "black",
      description: "Unlock by reaching Black tier",
      sortOrder: 20,
      isActive: true,
    },
    {
      name: "Silver Member",
      imageUrl: "/avatars/silver-member.png",
      rarity: "rare",
      unlockType: "tier",
      unlockValue: "silver",
      description: "Unlock by reaching Silver tier",
      sortOrder: 30,
      isActive: true,
    },
    {
      name: "Gold VIP",
      imageUrl: "/avatars/gold-vip.png",
      rarity: "epic",
      unlockType: "tier",
      unlockValue: "gold",
      description: "Exclusive Gold tier avatar",
      sortOrder: 40,
      isActive: true,
    },
    {
      name: "Platinum Elite",
      imageUrl: "/avatars/platinum-elite.png",
      rarity: "epic",
      unlockType: "tier",
      unlockValue: "platinum",
      description: "Prestigious Platinum avatar",
      sortOrder: 50,
      isActive: true,
    },
    {
      name: "Diamond Legend",
      imageUrl: "/avatars/diamond-legend.png",
      rarity: "legendary",
      unlockType: "tier",
      unlockValue: "diamond",
      description: "Rare Diamond tier exclusive",
      sortOrder: 60,
      isActive: true,
    },
    {
      name: "Ruby Master",
      imageUrl: "/avatars/ruby-master.png",
      rarity: "legendary",
      unlockType: "tier",
      unlockValue: "ruby",
      description: "Elite Ruby tier avatar",
      sortOrder: 70,
      isActive: true,
    },
    {
      name: "Streak Champion",
      imageUrl: "/avatars/streak-champion.png",
      rarity: "epic",
      unlockType: "challenge",
      unlockValue: "challenge-streak-master",
      description: "Earned by completing the Streak Master challenge",
      sortOrder: 100,
      isActive: true,
    },
    {
      name: "Social Star",
      imageUrl: "/avatars/social-star.png",
      rarity: "rare",
      unlockType: "challenge",
      unlockValue: "challenge-social-butterfly",
      description: "For active community members",
      sortOrder: 105,
      isActive: true,
    },
    {
      name: "Founder",
      imageUrl: "/avatars/founder.png",
      rarity: "legendary",
      unlockType: "tier",
      unlockValue: "founder",
      description: "Ultra-exclusive Founder tier avatar",
      sortOrder: 1000,
      isActive: true,
    },
    {
      name: "Holiday Special 2024",
      imageUrl: "/avatars/holiday-2024.png",
      rarity: "epic",
      unlockType: "seasonal",
      unlockValue: "winter-2024",
      description: "Limited time holiday avatar",
      isLimited: true,
      availableFrom: new Date("2024-12-01"),
      availableUntil: new Date("2025-01-15"),
      sortOrder: 500,
      isActive: true,
    },
  ];

  for (const avatar of avatars) {
    await prisma.avatar.upsert({
      where: { id: `avatar-${avatar.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: avatar,
      create: {
        id: `avatar-${avatar.name.toLowerCase().replace(/\s+/g, "-")}`,
        ...avatar,
      },
    });
  }

  console.log(`✅ Seeded ${avatars.length} avatars`);
}

async function seedRewards() {
  console.log("🎁 Seeding Reward Items...");

  const rewards = [
    {
      name: "Free Coffee",
      description: "Redeem for any coffee drink up to 50 EGP",
      type: "food",
      coinsCost: 5000,
      egpValue: 50,
      imageUrl: "/rewards/free-coffee.jpg",
      category: "drinks",
      sortOrder: 1,
      isActive: true,
    },
    {
      name: "Free Meal",
      description: "Any meal up to 150 EGP",
      type: "food",
      coinsCost: 15000,
      egpValue: 150,
      imageUrl: "/rewards/free-meal.jpg",
      category: "food",
      sortOrder: 2,
      isActive: true,
    },
    {
      name: "10% Off Voucher",
      description: "10% discount on your next order",
      type: "discount",
      coinsCost: 500,
      egpValue: null,
      imageUrl: "/rewards/discount-10.jpg",
      category: "discounts",
      metadata: { discountPercent: 10 },
      sortOrder: 5,
      isActive: true,
    },
    {
      name: "50 EGP Voucher",
      description: "50 EGP off any order",
      type: "discount",
      coinsCost: 5000,
      egpValue: 50,
      imageUrl: "/rewards/voucher-50.jpg",
      category: "discounts",
      metadata: { discountAmount: 50 },
      sortOrder: 6,
      isActive: true,
    },
    {
      name: "Free Delivery",
      description: "Free delivery on your next order",
      type: "discount",
      coinsCost: 300,
      egpValue: 30,
      imageUrl: "/rewards/free-delivery.jpg",
      category: "discounts",
      metadata: { freeDelivery: true },
      sortOrder: 3,
      isActive: true,
    },
    {
      name: "ELITE Coffee Mug",
      description: "Premium ceramic mug with ELITE branding",
      type: "merch",
      coinsCost: 40000,
      egpValue: 400,
      imageUrl: "/rewards/mug.jpg",
      stockQty: 100,
      maxPerUser: 2,
      category: "drinkware",
      metadata: { sku: "ELITE-MUG-001" },
      sortOrder: 20,
      isActive: true,
    },
    {
      name: "ELITE Tumbler",
      description: "Insulated stainless steel tumbler - 20oz",
      type: "merch",
      coinsCost: 60000,
      egpValue: 600,
      imageUrl: "/rewards/tumbler.jpg",
      stockQty: 50,
      maxPerUser: 1,
      category: "drinkware",
      metadata: { sku: "ELITE-TUMBLER-001", size: "20oz" },
      sortOrder: 21,
      isActive: true,
    },
    {
      name: "ELITE T-Shirt",
      description: "Premium cotton t-shirt with ELITE logo",
      type: "merch",
      coinsCost: 50000,
      egpValue: 500,
      imageUrl: "/rewards/tshirt.jpg",
      stockQty: 200,
      maxPerUser: 3,
      category: "clothing",
      metadata: { sku: "ELITE-TSHIRT-001", sizes: ["S", "M", "L", "XL", "XXL"] },
      sortOrder: 25,
      isActive: true,
    },
    {
      name: "ELITE Hoodie",
      description: "Premium hoodie with embroidered logo",
      type: "merch",
      coinsCost: 100000,
      egpValue: 1000,
      imageUrl: "/rewards/hoodie.jpg",
      stockQty: 50,
      maxPerUser: 2,
      category: "clothing",
      metadata: { sku: "ELITE-HOODIE-001", sizes: ["S", "M", "L", "XL", "XXL"] },
      sortOrder: 26,
      isActive: true,
    },
    {
      name: "ELITE Tote Bag",
      description: "Canvas tote bag with ELITE design",
      type: "merch",
      coinsCost: 25000,
      egpValue: 250,
      imageUrl: "/rewards/tote-bag.jpg",
      stockQty: 150,
      maxPerUser: 2,
      category: "accessories",
      metadata: { sku: "ELITE-TOTE-001" },
      sortOrder: 30,
      isActive: true,
    },
    {
      name: "Mystery Box - Small",
      description: "Random ELITE merchandise surprise (worth 200-500 EGP)",
      type: "mystery_box",
      coinsCost: 20000,
      egpValue: 300,
      imageUrl: "/rewards/mystery-small.jpg",
      stockQty: 100,
      maxPerUser: 5,
      category: "special",
      metadata: { tier: "small", minValue: 200, maxValue: 500 },
      sortOrder: 50,
      isActive: true,
    },
    {
      name: "Mystery Box - Large",
      description: "Premium ELITE merchandise surprise (worth 800-1500 EGP)",
      type: "mystery_box",
      coinsCost: 80000,
      egpValue: 1000,
      imageUrl: "/rewards/mystery-large.jpg",
      stockQty: 30,
      maxPerUser: 2,
      category: "special",
      metadata: { tier: "large", minValue: 800, maxValue: 1500 },
      sortOrder: 51,
      isActive: true,
    },
    {
      name: "Exclusive Avatar: Golden Crown",
      description: "Ultra-rare avatar for your profile",
      type: "avatar",
      coinsCost: 50000,
      egpValue: null,
      imageUrl: "/avatars/golden-crown.png",
      maxPerUser: 1,
      category: "digital",
      metadata: { avatarId: "avatar-golden-crown" },
      sortOrder: 100,
      isActive: true,
    },
  ];

  for (const reward of rewards) {
    await prisma.rewardItem.upsert({
      where: { id: `reward-${reward.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: reward,
      create: {
        id: `reward-${reward.name.toLowerCase().replace(/\s+/g, "-")}`,
        ...reward,
      },
    });
  }

  console.log(`✅ Seeded ${rewards.length} reward items`);
}

async function main() {
  console.log("🌟 Seeding ELITE Rewards System...\n");

  try {
    await seedChallenges();
    await seedAvatars();
    await seedRewards();

    console.log("\n✅ ELITE Rewards System seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
