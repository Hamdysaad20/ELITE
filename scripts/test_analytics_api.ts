import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAnalytics() {
  console.log('🧪 Testing Analytics System\n');

  try {
    // Get a user with orders
    const user = await prisma.user.findFirst({
      where: {
        orders: {
          some: {},
        },
      },
      include: {
        orders: {
          include: {
            savings: true,
            points: true,
          },
        },
        userSavings: true,
        userPoints: true,
      },
    });

    if (!user) {
      console.log('❌ No users with orders found');
      return;
    }

    console.log(`✅ Testing with user: ${user.email || user.id}\n`);

    // Test User Savings
    console.log('📊 USER SAVINGS DATA:');
    console.log('─────────────────────────────────');
    if (user.userSavings) {
      console.log(`Total Saved: EGP ${Number(user.userSavings.totalSaved).toFixed(2)}`);
      console.log(`Total Orders: ${user.userSavings.totalOrders}`);
      console.log(`Avg per Order: EGP ${Number(user.userSavings.averageSavingsPerOrder).toFixed(2)}`);
      console.log('\nSavings by Month:');
      const savingsByMonth = user.userSavings.savingsByMonth as any[];
      savingsByMonth.forEach((entry: any) => {
        console.log(`  ${entry.month}: EGP ${entry.amount.toFixed(2)}`);
      });
    } else {
      console.log('No savings data found');
    }

    // Test User Points
    console.log('\n⭐ USER POINTS DATA:');
    console.log('─────────────────────────────────');
    if (user.userPoints) {
      console.log(`Current Balance: ${user.userPoints.totalPoints} points`);
      console.log(`Worth: EGP ${(user.userPoints.totalPoints / 100).toFixed(2)}`);
      console.log(`Total Earned: ${user.userPoints.totalEarned} points`);
      console.log(`Total Redeemed: ${user.userPoints.totalRedeemed} points`);
      console.log(`Tier: ${user.userPoints.tier.toUpperCase()}`);
      console.log(`Points to Next Tier: ${user.userPoints.nextTierAt - user.userPoints.totalEarned}`);
    } else {
      console.log('No points data found');
    }

    // Test Order-level Data
    console.log('\n📦 ORDER-LEVEL DATA:');
    console.log('─────────────────────────────────');
    
    const ordersWithSavings = user.orders.filter(o => o.savings).slice(0, 3);
    console.log(`\nShowing first ${ordersWithSavings.length} orders with savings:\n`);
    
    ordersWithSavings.forEach((order, idx) => {
      console.log(`Order ${idx + 1}:`);
      console.log(`  ID: ${order.id.slice(0, 8)}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Total: EGP ${Number(order.total).toFixed(2)}`);
      if (order.savings) {
        console.log(`  Original: EGP ${Number(order.savings.originalPrice).toFixed(2)}`);
        console.log(`  Saved: EGP ${Number(order.savings.totalSavings).toFixed(2)}`);
      }
      if (order.points) {
        console.log(`  Points: ${order.points.totalPoints}`);
        console.log(`  Breakdown:`);
        const breakdown = order.points.pointsBreakdown as any[];
        breakdown.forEach((item: any) => {
          console.log(`    - ${item.reason}: ${item.amount} pts`);
        });
      }
      console.log('');
    });

    // Test Points Transactions
    console.log('💸 POINTS TRANSACTIONS:');
    console.log('─────────────────────────────────');
    const transactions = await prisma.pointsTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (transactions.length > 0) {
      console.log(`\nShowing last ${transactions.length} transactions:\n`);
      transactions.forEach((tx, idx) => {
        console.log(`${idx + 1}. ${tx.reason}`);
        console.log(`   Type: ${tx.type}`);
        console.log(`   Amount: ${tx.amount > 0 ? '+' : ''}${tx.amount} pts`);
        console.log(`   Balance: ${tx.balance} pts`);
        console.log(`   Date: ${tx.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    } else {
      console.log('No transactions found');
    }

    // Test Database Counts
    console.log('📈 DATABASE STATISTICS:');
    console.log('─────────────────────────────────');
    const stats = {
      totalUsers: await prisma.user.count(),
      totalOrders: await prisma.order.count(),
      ordersWithSavings: await prisma.orderSavings.count(),
      ordersWithPoints: await prisma.orderPoints.count(),
      usersWithSavings: await prisma.userSavings.count(),
      usersWithPoints: await prisma.userPoints.count(),
      totalTransactions: await prisma.pointsTransaction.count(),
    };

    console.log(`Total Users: ${stats.totalUsers}`);
    console.log(`Total Orders: ${stats.totalOrders}`);
    console.log(`Orders with Savings: ${stats.ordersWithSavings}`);
    console.log(`Orders with Points: ${stats.ordersWithPoints}`);
    console.log(`Users with Savings: ${stats.usersWithSavings}`);
    console.log(`Users with Points: ${stats.usersWithPoints}`);
    console.log(`Total Transactions: ${stats.totalTransactions}`);

    console.log('\n✅ All analytics data is accessible!\n');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testAnalytics()
  .then(() => {
    console.log('✓ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Test failed:', error);
    process.exit(1);
  });
