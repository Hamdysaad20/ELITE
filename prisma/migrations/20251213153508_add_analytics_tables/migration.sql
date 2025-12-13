-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountApplied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalPrice" DECIMAL(65,30),
ADD COLUMN     "pointsEarned" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "OrderSavings" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "originalPrice" DECIMAL(65,30) NOT NULL,
    "finalPrice" DECIMAL(65,30) NOT NULL,
    "totalSavings" DECIMAL(65,30) NOT NULL,
    "discounts" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderSavings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderPoints" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "basePoints" INTEGER NOT NULL,
    "bonusPoints" INTEGER NOT NULL DEFAULT 0,
    "multiplier" DECIMAL(65,30) NOT NULL DEFAULT 1.0,
    "totalPoints" INTEGER NOT NULL,
    "pointsBreakdown" JSONB NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isExpired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OrderPoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSavings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalSaved" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "averageSavingsPerOrder" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "savingsByMonth" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSavings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPoints" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "totalRedeemed" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'bronze',
    "nextTierAt" INTEGER NOT NULL DEFAULT 100000,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderSavings_orderId_key" ON "OrderSavings"("orderId");

-- CreateIndex
CREATE INDEX "OrderSavings_orderId_idx" ON "OrderSavings"("orderId");

-- CreateIndex
CREATE INDEX "OrderSavings_createdAt_idx" ON "OrderSavings"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrderPoints_orderId_key" ON "OrderPoints"("orderId");

-- CreateIndex
CREATE INDEX "OrderPoints_userId_idx" ON "OrderPoints"("userId");

-- CreateIndex
CREATE INDEX "OrderPoints_orderId_idx" ON "OrderPoints"("orderId");

-- CreateIndex
CREATE INDEX "OrderPoints_earnedAt_idx" ON "OrderPoints"("earnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserSavings_userId_key" ON "UserSavings"("userId");

-- CreateIndex
CREATE INDEX "UserSavings_userId_idx" ON "UserSavings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPoints_userId_key" ON "UserPoints"("userId");

-- CreateIndex
CREATE INDEX "UserPoints_userId_idx" ON "UserPoints"("userId");

-- CreateIndex
CREATE INDEX "UserPoints_tier_idx" ON "UserPoints"("tier");

-- CreateIndex
CREATE INDEX "PointsTransaction_userId_idx" ON "PointsTransaction"("userId");

-- CreateIndex
CREATE INDEX "PointsTransaction_createdAt_idx" ON "PointsTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "PointsTransaction_type_idx" ON "PointsTransaction"("type");

-- AddForeignKey
ALTER TABLE "OrderSavings" ADD CONSTRAINT "OrderSavings_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPoints" ADD CONSTRAINT "OrderPoints_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPoints" ADD CONSTRAINT "OrderPoints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSavings" ADD CONSTRAINT "UserSavings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPoints" ADD CONSTRAINT "UserPoints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
