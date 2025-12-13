import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeAnalytics() {
  console.log('🚀 Starting analytics initialization...\n');

  try {
    // Get all orders that don't have analytics data yet
    const orders = await prisma.order.findMany({
      where: {
        AND: [
          { savings: null },
          { points: null },
        ],
      },
      include: {
        user: true,
        items: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`📊 Found ${orders.length} orders to process\n`);

    let processedCount = 0;
    let errorCount = 0;

    for (const order of orders) {
      try {
        // Calculate original price (sum of all items at their unit price)
        // Since we don't have the original price stored, we'll use the totalPrice from items
        const originalPrice = order.items.reduce((sum, item) => {
          // Use totalPrice which is the full price for this item
          return sum + Number(item.totalPrice);
        }, 0);

        const finalPrice = order.total;
        const totalSavings = Math.max(0, originalPrice - finalPrice);

        // Create savings record if there were any savings
        if (totalSavings > 0 || originalPrice > 0) {
          await prisma.orderSavings.create({
            data: {
              orderId: order.id,
              originalPrice: originalPrice,
              finalPrice: finalPrice,
              totalSavings: totalSavings,
              discounts: order.discountApplied
                ? [
                    {
                      type: 'general',
                      name: 'Applied Discount',
                      amount: totalSavings,
                    },
                  ]
                : [],
            },
          });

          // Update order with original price
          await prisma.order.update({
            where: { id: order.id },
            data: {
              originalPrice: originalPrice,
              discountApplied: totalSavings > 0,
            },
          });
        }

        // Calculate points only for delivered orders
        if (order.status === 'DELIVERED' && order.total >= 50) {
          const basePoints = Math.floor(order.total * 100); // 1 EGP = 100 points

          // Check if this is user's first order
          const userOrderCount = await prisma.order.count({
            where: {
              userId: order.userId,
              createdAt: {
                lt: order.createdAt,
              },
            },
          });

          const isFirstOrder = userOrderCount === 0;
          const bonusPoints = isFirstOrder ? 1000 : 0;
          const multiplier = 1.0;
          const totalPoints = basePoints * multiplier + bonusPoints;

          // Create points record
          await prisma.orderPoints.create({
            data: {
              orderId: order.id,
              userId: order.userId,
              basePoints: basePoints,
              bonusPoints: bonusPoints,
              multiplier: multiplier,
              totalPoints: totalPoints,
              pointsBreakdown: [
                { reason: 'Order value', amount: basePoints },
                ...(bonusPoints > 0
                  ? [{ reason: 'First order bonus', amount: bonusPoints }]
                  : []),
              ],
              earnedAt: order.createdAt,
              expiresAt: new Date(
                order.createdAt.getTime() + 365 * 24 * 60 * 60 * 1000
              ), // 1 year
            },
          });

          // Update order with points earned
          await prisma.order.update({
            where: { id: order.id },
            data: { pointsEarned: totalPoints },
          });

          // Create points transaction
          await prisma.pointsTransaction.create({
            data: {
              userId: order.userId,
              type: 'earn',
              amount: totalPoints,
              balance: totalPoints, // Will be recalculated in aggregate
              reason: `Order #${order.orderNumber || order.id.slice(0, 8)}`,
              orderId: order.id,
              createdAt: order.createdAt,
            },
          });
        }

        processedCount++;
        if (processedCount % 10 === 0) {
          console.log(`✓ Processed ${processedCount}/${orders.length} orders...`);
        }
      } catch (error) {
        console.error(`❌ Error processing order ${order.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n✅ Processed ${processedCount} orders successfully`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} orders had errors`);
    }

    // Now calculate user aggregates
    console.log('\n📊 Calculating user aggregates...\n');

    const users = await prisma.user.findMany({
      include: {
        orders: {
          include: {
            savings: true,
            points: true,
          },
        },
      },
    });

    let userCount = 0;

    for (const user of users) {
      try {
        // Calculate savings aggregate
        const totalSaved = user.orders.reduce(
          (sum, order) => sum + (order.savings?.totalSavings || 0),
          0
        );
        const ordersWithSavings = user.orders.filter(
          (o) => o.savings && o.savings.totalSavings > 0
        ).length;
        const averageSavingsPerOrder =
          ordersWithSavings > 0 ? totalSaved / ordersWithSavings : 0;

        // Calculate savings by month
        const savingsByMonth: Record<string, number> = {};
        user.orders.forEach((order) => {
          if (order.savings) {
            const month = order.createdAt.toISOString().slice(0, 7);
            savingsByMonth[month] =
              (savingsByMonth[month] || 0) + Number(order.savings.totalSavings);
          }
        });

        await prisma.userSavings.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            totalSaved: totalSaved,
            totalOrders: user.orders.length,
            averageSavingsPerOrder: averageSavingsPerOrder,
            savingsByMonth: Object.entries(savingsByMonth).map(
              ([month, amount]) => ({ month, amount })
            ),
          },
          update: {
            totalSaved: totalSaved,
            totalOrders: user.orders.length,
            averageSavingsPerOrder: averageSavingsPerOrder,
            savingsByMonth: Object.entries(savingsByMonth).map(
              ([month, amount]) => ({ month, amount })
            ),
          },
        });

        // Calculate points aggregate
        const totalEarned = user.orders.reduce(
          (sum, order) => sum + (order.points?.totalPoints || 0),
          0
        );
        const totalRedeemed = 0; // No redemptions yet
        const totalPoints = totalEarned - totalRedeemed;

        // Determine tier
        let tier = 'bronze';
        let nextTierAt = 100000; // 1,000 EGP in points

        if (totalEarned >= 1000000) {
          tier = 'platinum';
          nextTierAt = Infinity;
        } else if (totalEarned >= 500000) {
          tier = 'gold';
          nextTierAt = 1000000;
        } else if (totalEarned >= 100000) {
          tier = 'silver';
          nextTierAt = 500000;
        }

        await prisma.userPoints.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            totalPoints: totalPoints,
            totalEarned: totalEarned,
            totalRedeemed: totalRedeemed,
            tier: tier,
            nextTierAt: nextTierAt,
          },
          update: {
            totalPoints: totalPoints,
            totalEarned: totalEarned,
            totalRedeemed: totalRedeemed,
            tier: tier,
            nextTierAt: nextTierAt,
          },
        });

        // Update transaction balances
        const transactions = await prisma.pointsTransaction.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'asc' },
        });

        let runningBalance = 0;
        for (const transaction of transactions) {
          runningBalance += transaction.amount;
          await prisma.pointsTransaction.update({
            where: { id: transaction.id },
            data: { balance: runningBalance },
          });
        }

        userCount++;
        if (userCount % 5 === 0) {
          console.log(`✓ Processed ${userCount}/${users.length} users...`);
        }
      } catch (error) {
        console.error(`❌ Error processing user ${user.id}:`, error);
      }
    }

    console.log(`\n✅ Processed ${userCount} user aggregates successfully\n`);
    console.log('🎉 Analytics initialization complete!\n');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializeAnalytics()
  .then(() => {
    console.log('✓ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Script failed:', error);
    process.exit(1);
  });
