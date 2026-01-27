-- CreateTable
CREATE TABLE "ItemAvailabilityNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ItemAvailabilityNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItemAvailabilityNotification_userId_productId_key" ON "ItemAvailabilityNotification"("userId", "productId");

-- CreateIndex
CREATE INDEX "ItemAvailabilityNotification_notified_idx" ON "ItemAvailabilityNotification"("notified");

-- CreateIndex
CREATE INDEX "ItemAvailabilityNotification_userId_idx" ON "ItemAvailabilityNotification"("userId");

-- AddForeignKey
ALTER TABLE "ItemAvailabilityNotification" ADD CONSTRAINT "ItemAvailabilityNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
