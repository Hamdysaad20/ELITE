-- CreateTable
CREATE TABLE "InventoryCountOverwriteLog" (
    "id" TEXT NOT NULL,
    "countId" TEXT NOT NULL,
    "overwrittenById" TEXT NOT NULL,
    "previousSnapshot" JSONB NOT NULL,
    "newSnapshot" JSONB NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryCountOverwriteLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryCountOverwriteLog_countId_createdAt_idx" ON "InventoryCountOverwriteLog"("countId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "InventoryCountOverwriteLog_overwrittenById_createdAt_idx" ON "InventoryCountOverwriteLog"("overwrittenById", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "InventoryCountOverwriteLog" ADD CONSTRAINT "InventoryCountOverwriteLog_countId_fkey" FOREIGN KEY ("countId") REFERENCES "InventoryCount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCountOverwriteLog" ADD CONSTRAINT "InventoryCountOverwriteLog_overwrittenById_fkey" FOREIGN KEY ("overwrittenById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
